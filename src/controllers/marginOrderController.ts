import Big from "big.js";
import { ethers } from "ethers";
import { MarginOrderCreated, MarginOrderCreatedBackup, OrderCreated, OrderCreatedBackup, PairCreated, UserPosition } from "../db";
import { handleToken } from "../handlers/token";
import { errorMessage } from "../helper/errorMessage";
import { ifPairCreated, ifUserPosition, marginOrderSignature, orderSignature } from "../helper/interface";
import { createOrderSchema } from "../helper/validateRequest";
import { mainIPFS } from "../IPFS/putFiles";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import { multicall } from "../sync/syncBalance";
import { getDecimals, validateMarginSignature } from "../utils";







export async function handleMarginOrderCreated(req: any, res: any) {
    try {

        let signature: string = req.body.signature;
        let data: marginOrderSignature["value"] = req.body.data;
        let chainId: string = req.body.chainId;
        let ipfs: boolean = req.body.ipfs;

        let addresses = [data.maker, data.token0, data.token1];

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


        let id: string | null = validateMarginSignature(data.maker, signature, data, chainId);

        if (!id) {
            console.log(errorMessage.signature);

            return res.status(400).send({ status: false, error: errorMessage.signature });
        }

        const isOrderPresent = await MarginOrderCreated.findOne({ id: id, chainId: chainId }).lean();

        if (isOrderPresent) {
            return res.status(201).send({ status: true, message: "marginOrder Already Created" });
        }

        let amount = Big(data.amount);


        let a = Big(data.amount);
        let x = Big(data.borrowLimit).div(Big(10).pow(6));
        let n = Number(data.loops) + 2;
        let balanceAmount: string | string[]= Big(a).times(((Big(x).pow(n)).minus(1)).div(Big(x).minus(1))).minus(a).toString().split(".");
        balanceAmount = balanceAmount[0];

        if (data.long == true) {

            const findUserPosition: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();
            // for new order
            const findUserPosition1: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token1, chainId: chainId }).lean();

            const token1Amount = Big(balanceAmount).times(data.exchangeRate).div(Big(10).pow(18));

            if (findUserPosition1) {
                const _id = findUserPosition1._id.toString();
                const currentInOrderBalance = Big(findUserPosition1.inOrderBalance).plus(token1Amount).toString();
                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
            }
            else {

                UserPosition.create(
                    {
                        token: data.token1,
                        chainId: chainId,
                        inOrderBalance: token1Amount,
                        // balance: userToken0Balance,
                        id: data.maker
                    }
                );
            }

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

        else if (data.long == false) {

            let findUserPosition: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token1, chainId: chainId });
            // for creating new order
            let findUserPosition1: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token0, chainId: chainId });

            if (findUserPosition1) {
                let _id = findUserPosition1._id.toString();
                let currentInOrderBalance = Big(findUserPosition1.inOrderBalance).plus(balanceAmount).toString();
                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
            }
            else {

                UserPosition.create(
                    {
                        token: data.token0,
                        chainId: chainId,
                        inOrderBalance: balanceAmount,
                        // balance: userToken0Balance,
                        id: data.maker
                    }
                );
            }

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


        let isPairExist: ifPairCreated = await PairCreated.findOne({ token0: data.token0, token1: data.token1, chainId: chainId }).lean();
        let createPair: ifPairCreated | any;

        if (!isPairExist) {
            let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [data.token0, data.token1]);
            let id = ethers.utils.keccak256(encoder);
            let token0 = await handleToken(data.token0, chainId);
            let token1 = await handleToken(data.token1, chainId);
            let temp = {
                id: id,
                exchangeRateDecimals: exchangeRateDecimals,
                minToken0Order: (10 ** 10).toString(),
                exchangeRate: '0',
                priceDiff: '0',
                token0: data.token0,
                token1: data.token1,
                chainId: chainId,
                symbol: `${token0}_${token1}`
            }
            createPair = await PairCreated.create(temp);

            console.log("Pair Created ", "T0 ", data.token0, "T1 ", data.token1, "CId ", chainId);

        }
        let pair: string;
        if (isPairExist) {
            pair = isPairExist.id?.toString();
        }
        else {
            pair = createPair.id.toString();
        }
        let cid;

        if (!ipfs) {
            cid = await mainIPFS([
                data,
                signature,
                chainId
            ],
                id
            );

            // MarginOrderCreatedBackup.create(

            //     {
            //         id: id,
            //         signature: signature,
            //         pair: pair,
            //         token0: data.token0,
            //         token1: data.token1,
            //         maker: data.maker,
            //         amount: data.amount,
            //         salt: data.salt,
            //         exchangeRate: data.exchangeRate,
            //         long: data.long,
            //         chainId: chainId,
            //         exchangeRateDecimals: exchangeRateDecimals,
            //         balanceAmount: balanceAmount,
            //         active: true,
            //         deleted: false,
            //         cid: cid,
            //         borrowLimit: data.borrowLimit,
            //         loops: data.loops,
            //         currentLoop: currentLoop
            //     }
            // );

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
                    buy: data.long,
                    chainId: chainId,
                    exchangeRateDecimals: exchangeRateDecimals,
                    balanceAmount: balanceAmount,
                    active: true,
                    deleted: false,
                    cid: cid,
                    borrowLimit: data.borrowLimit,
                    loops: data.loops,
                    long: data.long,
                    margin: true
                }
            );
        }


        OrderCreated.create(

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
                buy: data.long,
                chainId: chainId,
                exchangeRateDecimals: exchangeRateDecimals,
                balanceAmount: balanceAmount,
                active: true,
                deleted: false,
                cid: cid,
                borrowLimit: data.borrowLimit,
                loops: data.loops,
                long: data.long,
                margin: true
            }
        );

        // MarginOrderCreated.create(

        //     {
        //         id: id,
        //         signature: signature,
        //         pair: pair,
        //         token0: data.token0,
        //         token1: data.token1,
        //         maker: data.maker,
        //         amount: data.amount,
        //         salt: data.salt,
        //         exchangeRate: data.exchangeRate,
        //         long: data.long,
        //         chainId: chainId,
        //         exchangeRateDecimals: exchangeRateDecimals,
        //         balanceAmount: balanceAmount,
        //         active: true,
        //         deleted: false,
        //         cid: cid,
        //         borrowLimit: data.borrowLimit,
        //         loops: data.loops,
        //         currentLoop: currentLoop
        //     }
        // );

        // socket io data
        if (!ipfs) {
            socketService.emit(EVENT_NAME.PAIR_ORDER, {
                amount: balanceAmount,
                exchangeRate: data.exchangeRate,
                buy: data.long,
                pair: pair
            });
        }

        console.log("MarginOrder Created ", "maker ", data.maker, "amount ", data.amount.toString(), id);

        return res.status(201).send({ status: true, message: "Margin Order created successfully" });

    }
    catch (error: any) {

        if (error.isJoi == true) error.status = 422;
        console.log("Error @ handleOrderCreated", error);
        return res.status(error.status).send({ status: false, error: error.message });
    }
}