



import { PairCreated, OrderCreated, UserPosition, OrderCreatedBackup } from "../../db";
import { handleToken } from "../../handlers/token";
import { getDecimals, validateSignature } from "../../utils/utils";
import Big from "big.js";
import { ethers } from "ethers";
import { createOrderSchema } from "../../helper/validateRequest";
import { getMultiBalance, multicall } from "../../sync/syncBalance";
import { mainIPFS } from "../../IPFS/putFiles";
import { errorMessage } from "../../helper/errorMessage";
import {  ifPairCreated, ifUserPosition } from "../../helper/interface";
import { EVENT_NAME, socketService } from "../../socketIo/socket.io";
import { _handleMarginOrderCreated } from "./marginOrderController";
import { sentry } from "../../../app";
import { getExchangeAddress } from "../../helper/chain";







/**
 * 
 * @dev This api function would create order and store it into data base
 * @notice verify signature,check if data coming from backup, check user inOrder balance, wallet balance, allowance, if pair is not present then create corresponding token and pair
 * @param {*} req.body.signature (string)  
 * @param {*} req.body.data (object) this data will be verify with the signature
 * example  
 * "data" :{
    "maker": "0x103B62f68Da23f20055c572269be67fA7635f2fc",
    "token0": "0x842681C1fA28EF2AA2A4BDE174612e901D2b7827",
    "token1": "0xa50fABf59f2c11fF0F02E7c94A82B442611F37B2",
    "amount": "1000000000000000000",
    "orderType": 0,
    "salt": "12345",
    "exchangeRate": "18000000000000000000000"
    }
 * @param {*} req.body.chainId (string) numeric chainId
 * @param {*} req.body.ipfs (boolean) if it is present that means request is sent from backup 
 * @returns  error with message if any validation fail, if success return order created successfully
 */
export async function handleOrderCreated(req: any, res: any) {
    try {

        let signature: string = req.body.signature?.toLowerCase();
        let data = req.body.data;
        let chainId: string = req.body.chainId;
        let ipfs: boolean | undefined = req.body.ipfs;
        let orderType: number = data.orderType;
        let addresses = [data.maker, data.token0, data.token1];
        let multicallAddress = req.body.multicall; 
        data.maker = data.maker?.toLowerCase();
        data.token0 = data.token0?.toLowerCase();
        data.token1 = data.token1?.toLowerCase();
        // await createOrderSchema.validateAsync({ createOrderSchemaData: req.body.data, signature: signature, chainId: chainId });
        for (let i in addresses) {

            if (!ethers.utils.isAddress(addresses[i])) {
                console.log(`${errorMessage.address, addresses[i]}`);
                return res.status(400).send({ status: false, error: errorMessage.address });
            }
        }
        // geting exchangeRate decimal
        let exchangeRateDecimals: number | string = Number(getDecimals(data.exchangeRate));

        if (isNaN(exchangeRateDecimals) == true) {
            return res.status(400).send({ status: false, error: exchangeRateDecimals });
        }


        let id: string | null = validateSignature(data.maker, signature, data, chainId);

        if (!id) {
            console.log(errorMessage.signature);

            return res.status(400).send({ status: false, error: errorMessage.signature });
        }

        const isOrderPresent = await OrderCreated.findOne({ id: id, chainId: chainId }).lean();

        if (isOrderPresent) {
            return res.status(201).send({ status: true, message: "Order Already Created" });
        }

        // if margin Order
        if (orderType == 2 || orderType == 3) {
            let response = await _handleMarginOrderCreated(signature, data, chainId, ipfs, id, exchangeRateDecimals)

            if (response.status == false) {
                return res.status(response.statusCode).send({ status: false, error: response.error })
            }
            else if (response.status == true) {
                return res.status(response.statusCode).send({ status: true, message: response.message })
            }
        }

        let amount = Big(data.amount);

        if (data.orderType == 1) {

            const findUserPosition: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();

            let multicallData: number[] | null;
            let userToken0Balance = 0;
            let allowance = 0;
            
            if (!ipfs) {
                multicallData = await multicall(data.token0, data.maker, chainId)
                if (multicallData) {
                    userToken0Balance = multicallData[0];
                    allowance = multicallData[1];
                }
            }

            if (findUserPosition) {

                let _id = findUserPosition._id.toString();

                let currentInOrderBalance = Big(findUserPosition.inOrderBalance).plus(amount).toString();

                if (!ipfs && Number(allowance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.allowance} token0`);
                    return res.status(400).send({ status: false, error: errorMessage.allowance });
                }

                if (!ipfs && Number(userToken0Balance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.balance} token0`);
                    return res.status(400).send({ status: false, error: errorMessage.balance });
                }


                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
            } else {

                if (!ipfs && Number(allowance) < Number(amount)) {
                    console.log(`${errorMessage.allowance} token0`);
                    return res.status(400).send({ status: false, error: errorMessage.allowance });
                }

                if (!ipfs && Number(userToken0Balance) < Number(amount)) {
                    console.log(`${errorMessage.balance} token0`);
                    return res.status(400).send({ status: false, error: errorMessage.balance });
                }

                UserPosition.create(
                    {
                        token: data.token0,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        // balance: userToken0Balance,
                        id: data.maker
                    }
                );

            }
        }

        else if (data.orderType == 0) {

            let findUserPosition: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token1, chainId: chainId });

            let multicallData: number[] | null
            let userToken1Balance = 0
            let allowance = 0

            if (!ipfs) {
                multicallData = await multicall(data.token1, data.maker, chainId)
                if (multicallData) {
                    userToken1Balance = multicallData[0];
                    allowance = multicallData[1];
                }
            }

            amount = Big(amount).times(data.exchangeRate).div(Big(10).pow(18));
            if (findUserPosition) {

                let _id = findUserPosition._id.toString();

                let currentInOrderBalance = Big(findUserPosition.inOrderBalance).plus(amount).toString();

                if (!ipfs && Number(allowance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.allowance} token1`);
                    return res.status(400).send({ status: false, error: errorMessage.allowance });
                }

                if (!ipfs && Number(userToken1Balance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.balance} token1`);
                    return res.status(400).send({ status: false, error: errorMessage.balance });
                }


                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
            } else {

                if (!ipfs && Number(allowance) < Number(amount)) {
                    console.log(`${errorMessage.allowance} token1`);
                    return res.status(400).send({ status: false, error: errorMessage.allowance });
                }

                if (!ipfs && Number(userToken1Balance) < Number(amount)) {
                    console.log(`${errorMessage.balance} token1`);
                    return res.status(400).send({ status: false, error: errorMessage.balance });
                }

                UserPosition.create(
                    {
                        token: data.token1,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        // balance: userToken1Balance,
                        id: data.maker
                    }
                );

            }
        }

        let isPairExist: ifPairCreated = await PairCreated.findOne({ token0: data.token0, token1: data.token1, chainId: chainId, active: true }).lean();
        let createPair: ifPairCreated | any;

        if (!isPairExist) {
            // cheking for opposite pair
            let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [data.token1, data.token0]);
            let id = ethers.utils.keccak256(encoder);

            let isPairExist1: ifPairCreated = await PairCreated.findOne({ id: id, active: true }).lean();;

            if (isPairExist1) {
                createPair = isPairExist1;
            }

            if (!isPairExist1) {
                let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [data.token0, data.token1]);
                let id = ethers.utils.keccak256(encoder);

                let token0 = await handleToken(data.token0, chainId);
                let token1 = await handleToken(data.token1, chainId);
                let marginEnabled = false;
                if (token0?.marginEnabled == true && token1?.marginEnabled == true) {
                    marginEnabled = true
                }
                let temp = {
                    id: id,
                    exchangeRateDecimals: exchangeRateDecimals,
                    minToken0Order: token0?.minToken0Amount,
                    exchangeRate: '0',
                    priceDiff: '0',
                    token0: data.token0,
                    token1: data.token1,
                    chainId: chainId,
                    symbol: `${token0?.symbol}_${token1?.symbol}`,
                    marginEnabled: marginEnabled,
                    active: true
                }
                createPair = await PairCreated.create(temp);

                console.log("Pair Created ", "T0 ", data.token0, "T1 ", data.token1, "CId ", chainId);

            }

        }
        let pair: string;
        if (isPairExist) {
            pair = isPairExist.id?.toString();
        }
        else {
            pair = createPair.id.toString();
        }
        let cid = "";
        if (!ipfs) {

            if (!process.env.NODE_ENV?.includes('test')) {
                cid = await mainIPFS([
                    data,
                    signature,
                    chainId
                ],
                    id
                );
            }

            OrderCreatedBackup.create(
                {
                    id: id,
                    signature: signature,
                    pair: pair,
                    token0: data.token0,
                    token1: data.token1,
                    maker: data.maker,
                    amount: data.amount,
                    salt: data.salt,
                    exchangeRate: data.exchangeRate,
                    orderType: data.orderType,
                    chainId: chainId,
                    exchangeRateDecimals: exchangeRateDecimals,
                    balanceAmount: data.amount,
                    active: true,
                    deleted: false,
                    cid: cid,
                }
            );
        }

        await OrderCreated.create(

            {
                id: id,
                signature: signature,
                pair: pair,
                token0: data.token0,
                token1: data.token1,
                maker: data.maker,
                amount: data.amount,
                salt: data.salt,
                exchangeRate: data.exchangeRate,
                orderType: data.orderType,
                chainId: chainId,
                exchangeRateDecimals: exchangeRateDecimals,
                balanceAmount: data.amount,
                active: true,
                deleted: false,
                cid: cid,
            }
        );

        // socket io data
        if (!ipfs) {
            socketService.emit(EVENT_NAME.PAIR_ORDER, {
                amount: data.amount,
                exchangeRate: data.exchangeRate,
                orderType: data.orderType,
                pair: pair
            });
        }

        console.log("Order Created ", "maker ", data.maker, "amount ", data.amount.toString(), id);

        return res.status(201).send({ status: true, message: "Order created successfully" });

    }
    catch (error: any) {

        if (error.isJoi == true) error.status = 422;
        sentry.captureException(error)
        console.log("Error @ handleOrderCreated", error);
        return res.status(error.status).send({ status: false, error: error.message });
    }
}
