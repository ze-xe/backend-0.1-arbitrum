import Big from "big.js";
import { ethers } from "ethers";
import { sentry } from "../../app";
import { OrderCreated, OrderCreatedBackup, PairCreated, UserPosition } from "../db";
import { handleToken } from "../handlers/token";
import { errorMessage } from "../helper/errorMessage";
import { ifPairCreated, ifUserPosition } from "../helper/interface";
import { mainIPFS } from "../IPFS/putFiles";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import { multicall } from "../sync/syncBalance";


export async function _handleMarginOrderCreated(signature: string, data: any, chainId: string, ipfs: boolean, id: string, exchangeRateDecimals: any) {
    try {

        let amount = Big(data.amount);
        let a = Big(data.amount);
        let x = Big(data.borrowLimit).div(Big(10).pow(6));
        let n = Number(data.loops) + 1;
        let balanceAmount: string | string[] = Big(a).times(((Big(x).pow(n)).minus(1)).div(Big(x).minus(1))).minus(a).toString().split(".");
        balanceAmount = balanceAmount[0];

        data.maker = data.maker.toLowerCase();
        data.token0 = data.token0.toLowerCase();
        data.token1 = data.token1.toLowerCase();

        if (data.orderType == 2) {

            const findUserPosition: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();
            // for new order , will sell token1
            const findUserPosition1: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token1, chainId: chainId }).lean();

            const token1Amount = 
            Big(balanceAmount)
            .times(data.exchangeRate)
            .div(Big(10).pow(18));

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
                    return { status: false, error: errorMessage.allowance, statusCode: 400 };
                }

                if (!ipfs && Number(userToken0Balance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.balance} token0`);
                    return { status: false, error: errorMessage.balance, statusCode: 400 };
                }

                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
            } else {

                if (!ipfs && Number(allowance) < Number(amount)) {
                    console.log(`${errorMessage.allowance} token0`);
                    return { status: false, error: errorMessage.allowance, statusCode: 400 };
                }

                if (!ipfs && Number(userToken0Balance) < Number(amount)) {
                    console.log(`${errorMessage.balance} token0`);
                    return { status: false, error: errorMessage.balance, statusCode: 400 };
                }

                UserPosition.create(
                    {
                        token: data.token0,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        id: data.maker
                    }
                );

            }
        }

        else if (data.orderType == 3) {

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
                    return { status: false, error: errorMessage.allowance, statusCode: 400 };
                }

                if (!ipfs && Number(userToken1Balance) < Number(currentInOrderBalance)) {
                    console.log(`${errorMessage.balance} token1`);
                    return { status: false, error: errorMessage.balance, statusCode: 400 };
                }


                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
            } else {

                if (!ipfs && Number(allowance) < Number(amount)) {
                    console.log(`${errorMessage.allowance} token1`);
                    return { status: false, error: errorMessage.allowance, statusCode: 400 };
                }

                if (!ipfs && Number(userToken1Balance) < Number(amount)) {
                    console.log(`${errorMessage.balance} token1`);
                    return { status: false, error: errorMessage.balance, statusCode: 400 };
                }

                UserPosition.create(
                    {
                        token: data.token1,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        id: data.maker
                    }
                );

            }

        }


        let isPairExist: ifPairCreated = await PairCreated.findOne({ token0: data.token0, token1: data.token1, chainId: chainId }).lean();
        let createPair: ifPairCreated | any;

        if (!isPairExist) {
            // cheking for opposite pair
            let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [data.token1, data.token0]);
            let id = ethers.utils.keccak256(encoder);

            let isPairExist1: ifPairCreated = await PairCreated.findOne({ id: id }).lean();;

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
                    minToken0Order: (10 ** 10).toString(),
                    exchangeRate: '0',
                    priceDiff: '0',
                    token0: data.token0,
                    token1: data.token1,
                    chainId: chainId,
                    symbol: `${token0?.symbol}_${token1?.symbol}`,
                    marginEnabled: marginEnabled
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
        let cid;

        if (!ipfs) {
            cid = await mainIPFS([
                data,
                signature,
                chainId
            ],
                id
            );

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
                    chainId: chainId,
                    exchangeRateDecimals: exchangeRateDecimals,
                    balanceAmount: balanceAmount,
                    active: true,
                    deleted: false,
                    cid: cid,
                    borrowLimit: data.borrowLimit,
                    loops: data.loops,
                    orderType: data.orderType,
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
                chainId: chainId,
                exchangeRateDecimals: exchangeRateDecimals,
                balanceAmount: balanceAmount,
                active: true,
                deleted: false,
                cid: cid,
                borrowLimit: data.borrowLimit,
                loops: data.loops,
                orderType: data.orderType,
            }
        );


        // socket io data
        if (!ipfs) {
            socketService.emit(EVENT_NAME.PAIR_ORDER, {
                amount: balanceAmount,
                exchangeRate: data.exchangeRate,
                orderType: data.orderType,
                pair: pair
            });
        }

        console.log("MarginOrder Created ", "maker ", data.maker, "amount ", data.amount.toString(), id);

        return { status: true, message: "Margin Order created successfully", statusCode: 201 };

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ handleOrderCreated", error);
        return { status: false, error: error.message, statusCode: 500 };
    }
}