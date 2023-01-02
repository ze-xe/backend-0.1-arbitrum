import Big from "big.js";
import { ethers } from "ethers";
import { sentry } from "../../app";
import { OrderCreated, OrderCreatedBackup, PairCreated, Token, UserPosition } from "../db";
import { handleToken } from "../handlers/token";
import { leverAddress } from "../helper/constant";
import { errorMessage } from "../helper/errorMessage";
import { ifPairCreated, ifUserPosition } from "../helper/interface";
import { mainIPFS } from "../IPFS/putFiles";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import { multicall, multicallFor2Tokens } from "../sync/syncBalance";
import { getProvider, leverageAbi } from "../utils";


export async function __handleMarginOrderCreated(signature: string, data: any, chainId: string, ipfs: boolean | undefined, id: string, exchangeRateDecimals: any) {
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
        let borrowLimit = Big(data.borrowLimit).div(Big(10).pow(6)).toNumber();

        if (borrowLimit > 0.75 || borrowLimit < 0.05) {
            return { status: false, error: errorMessage.borrowLimit, statusCode: 400 }
        }


        let provider = getProvider(chainId);
        let lever = new ethers.Contract(leverAddress, leverageAbi, provider);

        // checking market enter or not
        let assetIn: string[] = await lever.getAssetsIn(data.maker);

        let _multicall = await multicallFor2Tokens(data.token0, data.token1, data.maker, chainId)
        console.log(_multicall, "Multicall");

        if (data.orderType == 2) {

            // check market enter or not
            const token = await Token.findOne({ id: data.token0 }).lean()! as any;

            if (!assetIn.includes(token.cId)) {
                return { status: false, error: errorMessage.market, statusCode: 400 }
            }

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

            // check market enter or not
            const token = await Token.findOne({ id: data.token1 }).lean()! as any;

            if (!assetIn.includes(token.cId)) {
                return { status: false, error: errorMessage.market, statusCode: 400 }
            }

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

        return { status: true, message: "Order created successfully", statusCode: 201 };

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ handleOrderCreated", error);
        return { status: false, error: error.message, statusCode: 500 };
    }
}

export async function _handleMarginOrderCreated(signature: string, data: any, chainId: string, ipfs: boolean | undefined, id: string, exchangeRateDecimals: any) {
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

        let borrowLimit = Big(data.borrowLimit).div(Big(10).pow(6)).toNumber();

        if (borrowLimit > 0.75 || borrowLimit < 0.05) {
            return { status: false, error: errorMessage.borrowLimit, statusCode: 400 }
        }

        let provider = getProvider(chainId);
        let lever = new ethers.Contract(leverAddress, leverageAbi, provider);

        // checking market enter or not
        let assetIn: string[] = (await lever.getAssetsIn(data.maker)).map((x: string) => x.toLocaleLowerCase())

        let multicallData: number[] | null;
        let userToken0Balance = 0;
        let userToken1Balance = 0;
        let allowanceToken0 = 0;
        let allowanceToken1 = 0;

        if (!ipfs) {

            multicallData = await multicallFor2Tokens(data.token0, data.token1, data.maker, chainId);

            if (multicallData) {
                userToken0Balance = multicallData[0];
                allowanceToken0 = multicallData[1];
                userToken1Balance = multicallData[2];
                allowanceToken1 = multicallData[3]
            }
        }

        const findUserPosition0: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();
        // for new order , will sell token1
        const findUserPosition1: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token1, chainId: chainId }).lean();

        let token0CurrentInOrder = Big(findUserPosition0?.inOrderBalance ?? 0).plus(amount).toNumber();

        const token1Amount =
            Big(amount)
                .times(data.exchangeRate)
                .div(Big(10).pow(18)).toString();

        let token1CurrentInOrder = Big(findUserPosition0?.inOrderBalance ?? 0).plus(token1Amount).toNumber();

        if (data.orderType == 2) {

            // check market enter or not
            const token = await Token.findOne({ id: data.token0 }).lean()! as any;

            if (!assetIn.includes(token.cId)) {
                return { status: false, error: errorMessage.market, statusCode: 400 }
            }

            if (!ipfs && Number(allowanceToken0) < Number(token0CurrentInOrder)) {
                console.log(`${errorMessage.allowance} token0`);
                return { status: false, error: errorMessage.allowance, statusCode: 400 };
            }
            if (!ipfs && Number(allowanceToken1) < Number(token1CurrentInOrder)) {
                console.log(`${errorMessage.allowance} token1`);
                return { status: false, error: errorMessage.allowance, statusCode: 400 };
            }

            if (!ipfs && Number(userToken0Balance) < Number(token0CurrentInOrder)) {
                console.log(`${errorMessage.balance} token0`);
                return { status: false, error: errorMessage.balance, statusCode: 400 };
            }

            if (findUserPosition0) {

                let _id = findUserPosition0._id.toString();
                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: token0CurrentInOrder } }
                );
            } else {

                UserPosition.create(
                    {
                        token: data.token0,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        id: data.maker
                    }
                );

            }

            if (findUserPosition1) {
                const _id = findUserPosition1._id.toString();
                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: token1CurrentInOrder } }
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
        }

        else if (data.orderType == 3) {

            // check market enter or not
            const token = await Token.findOne({ id: data.token1 }).lean()! as any;

            if (!assetIn.includes(token.cId)) {
                return { status: false, error: errorMessage.market, statusCode: 400 }
            }

            if (!ipfs && Number(allowanceToken1) < Number(token1CurrentInOrder)) {
                console.log(`${errorMessage.allowance} token1`);
                return { status: false, error: errorMessage.allowance, statusCode: 400 };
            }
            if (!ipfs && Number(allowanceToken0) < Number(token0CurrentInOrder)) {
                console.log(`${errorMessage.allowance} token0`);
                return { status: false, error: errorMessage.allowance, statusCode: 400 };
            }

            if (!ipfs && Number(userToken1Balance) < Number(token1CurrentInOrder)) {
                console.log(`${errorMessage.balance} token1`);
                return { status: false, error: errorMessage.balance, statusCode: 400 };
            }


            if (findUserPosition1) {

                let _id = findUserPosition1._id.toString();
                await UserPosition.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: token1CurrentInOrder } }
                );
            } else {

                UserPosition.create(
                    {
                        token: data.token1,
                        chainId: chainId,
                        inOrderBalance: token1Amount,
                        id: data.maker
                    }
                );

            }
            if (findUserPosition0) {
                let _id = findUserPosition0._id.toString();
                let currentInOrderBalance = Big(findUserPosition0.inOrderBalance).plus(balanceAmount).toString();
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

        return { status: true, message: "Order created successfully", statusCode: 201 };

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ handleOrderCreated", error);
        return { status: false, error: error.message, statusCode: 500 };
    }
}