import { PairCreated, OrderCreated, OrderExecuted, UserPosition, Token } from "../db";
import Big from "big.js";
import { ifOrderCreated, ifPairCreated, ifUserPosition } from "../helper/interface";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import { getDecimals, getERC20ABI, getProvider } from "../utils";
import { ethers } from "ethers";
import { sentry } from "../../app";





async function handleOrderExecuted(data: any, argument: any) {

    try {
        
        const isDuplicateTxn = await OrderExecuted.findOne({
            txnId: argument.txnId,
            blockNumber: argument.blockNumber,
            blockTimestamp: argument.blockTimestamp,
            logIndex: argument.logIndex
        });

        if (isDuplicateTxn) {
            console.log("OrderExecute duplicate, id :", data[0].toLowerCase())
            return;
        }

        let id = data[0]?.toLowerCase();
        let taker = data[1]?.toLowerCase();
        let fillAmount = data[2].toString();
        argument.id = id;
        argument.taker = taker;
        argument.fillAmount = fillAmount;

        let getOrderDetails: ifOrderCreated = await OrderCreated.findOne({ id: id, chainId: argument.chainId }).lean();

        if (!getOrderDetails) {
            return console.log("OrderId not found @ execute", id);
        }

        let getPairDetails: ifPairCreated | null = await PairCreated.findOne({ id: getOrderDetails.pair, chainId: getOrderDetails.chainId }).lean();

        if (!getPairDetails) {
            return console.log(`Pair Id not found in order Executed`);
        }
        argument.exchangeRate = getOrderDetails.exchangeRate;
        argument.pair = getOrderDetails.pair;
        argument.exchangeRateDecimals = Number(getPairDetails.exchangeRateDecimals);
        argument.orderType = getOrderDetails.orderType;

        // updating ExchangeRateDecimal
        let exchangeRateDecimals: number | string = Number(getDecimals(getOrderDetails.exchangeRate));

        if (isNaN(exchangeRateDecimals) == false) {
            argument.exchangeRateDecimals = exchangeRateDecimals;
        }


        // updating pair orders

        socketService.emit(EVENT_NAME.PAIR_ORDER, {
            amount: `-${fillAmount}`,
            exchangeRate: getOrderDetails.exchangeRate,
            orderType: getOrderDetails.orderType,
            pair: getOrderDetails.pair
        });

        // updating pair history
        socketService.emit(EVENT_NAME.PAIR_HISTORY, {
            amount: fillAmount,
            exchangeRate: getOrderDetails.exchangeRate,
            orderType: getOrderDetails.orderType,
            pair: getOrderDetails.pair
        })

        await OrderExecuted.create(argument);
        let priceDiff = new Big(getOrderDetails.exchangeRate).minus(getPairDetails.exchangeRate).toString();

        await PairCreated.findOneAndUpdate(
            { _id: getPairDetails._id.toString() },
            { $set: { exchangeRate: getOrderDetails.exchangeRate, priceDiff: priceDiff, exchangeRateDecimals: argument.exchangeRateDecimals } }
        );

        if (getOrderDetails.orderType == 1 || getOrderDetails.orderType == 3) {
            // for maker

            let token0 = getPairDetails.token0;

            let getUserPosition0: ifUserPosition | null = await UserPosition.findOne({ id: getOrderDetails.maker, token: token0 });

            if (!getUserPosition0) {
                return console.log(`user position not found for token0 ${token0}, make ${getOrderDetails.maker}`)
            }

            let currentInOrderBalance0 = new Big(getUserPosition0.inOrderBalance).minus(fillAmount).toString();

            await UserPosition.findOneAndUpdate(
                { id: getOrderDetails.maker, token: token0 },
                { $set: { inOrderBalance: currentInOrderBalance0 } }
            );

            let currentFillAmount = new Big(getOrderDetails.balanceAmount).minus(fillAmount);

            if (Number(currentFillAmount) <= Number(getPairDetails.minToken0Order)) {
                await OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() },
                    { $set: { balanceAmount: currentFillAmount, deleted: true, active: false } });
            }
            else {
                await OrderCreated.findOneAndUpdate(
                    { _id: getOrderDetails._id.toString() },
                    { $set: { balanceAmount: currentFillAmount } }
                );
            }

        }
        else if (getOrderDetails.orderType == 0 || getOrderDetails.orderType == 2) {
            // for maker

            let token1 = getPairDetails.token1;

            let getUserPosition1: ifUserPosition | null = await UserPosition.findOne({ id: getOrderDetails.maker, token: token1 });

            if (!getUserPosition1) {
                return console.log(`User Position not found ${getOrderDetails.maker}, ${token1}`)
            }

            let currentBalance1 = Big(getUserPosition1.inOrderBalance).minus(Big(fillAmount).times(getOrderDetails.exchangeRate).div(Big(10).pow(18))).toString();

            await UserPosition.findOneAndUpdate(
                { id: getOrderDetails.maker, token: token1 },
                { $set: { inOrderBalance: currentBalance1 } }
            );

            let currentFillAmount = new Big(getOrderDetails.balanceAmount).minus(fillAmount);

            if (Number(currentFillAmount) < Number(getPairDetails.minToken0Order)) {
                await OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() },
                    { $set: { deleted: true, active: false, balanceAmount: currentFillAmount } });
            }
            else {
                await OrderCreated.findOneAndUpdate(
                    { _id: getOrderDetails._id.toString() },
                    { $set: { balanceAmount: currentFillAmount } }
                );
            }
        }

        console.log("Order Executed", taker, fillAmount, id);

    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleOrderExecuted", error);
    }

}


async function handleOrderCancelled(data: any) {

    try{
        let id = data[0].toLowerCase();

        let orderDetails: ifOrderCreated | null = await OrderCreated.findOne({ id: id }).lean();
    
        if (!orderDetails) {
            return console.log(`Order cancelled OrderId not found ${data[0]}`);
        }
    
        if (orderDetails.cancelled == true) {
            return console.log("Order is already cancelled");
        }
        // cancel order 
    
        socketService.emit(EVENT_NAME.PAIR_ORDER, {
            amount: `-${orderDetails.balanceAmount}`,
            exchangeRate: orderDetails.exchangeRate,
            orderType: orderDetails.orderType,
            pair: orderDetails.pair
        });
        // update user inOrder
        if (orderDetails.orderType == 1 || orderDetails.orderType == 3) {
            let getUser: ifUserPosition | null = await UserPosition.findOne({ id: orderDetails.maker, token: orderDetails.token0, chainId: orderDetails.chainId }).lean();
            if (getUser) {
                let currentInOrderBalance = Big(getUser.inOrderBalance).minus(orderDetails.balanceAmount).toString();
    
                await UserPosition.findOneAndUpdate(
                    { id: orderDetails.maker, token: orderDetails.token0, chainId: orderDetails.chainId },
                    { $set: { inOrderBalance: currentInOrderBalance } }
                );
    
            }
    
        }
        else if (orderDetails.orderType == 0 || orderDetails.orderType == 2) {
            let getUser: ifUserPosition | null = await UserPosition.findOne({ id: orderDetails.maker, token: orderDetails.token1, chainId: orderDetails.chainId }).lean()
            if (getUser) {
                let token1Amount = Big(getUser.inOrderBalance).minus(Big(orderDetails.balanceAmount).times(orderDetails.exchangeRate).div(Big(10).pow(18))).toString();
    
                await UserPosition.findOneAndUpdate(
                    { id: orderDetails.maker, token: orderDetails.token1, chainId: orderDetails.chainId },
                    { $set: { inOrderBalance: token1Amount } }
                );
            }
    
        }
    
        await OrderCreated.findOneAndUpdate({ _id: orderDetails._id }, { $set: { cancelled: true, active: false } });
    
        console.log(`order Cancelled, orderId : ${data[0]}`);
    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleOrderCancelled", error);
    }
    

}


export async function handleMarginEnabled(data: string[]) {
    try {

        let token: string = data[0].toLowerCase();
        let cToken = data[1];
        let chainId = "421613";
        const isTokenExist = await Token.findOne({ id: token }).lean();
        let symbol;

        if (isTokenExist) {
            if (isTokenExist.marginEnabled == true) {
                return
            }
            else if (isTokenExist.marginEnabled == false) {
                await Token.findOneAndUpdate({ id: token }, { $set: { marginEnabled: true } });
                symbol = isTokenExist.symbol;
            }
        }

        if (!isTokenExist) {
            let provider = getProvider(chainId);
            let getTokenDetails = new ethers.Contract(token, getERC20ABI(), provider);
            let name = getTokenDetails["name"]();
            symbol = getTokenDetails["symbol"]();
            let decimals = getTokenDetails["decimals"]();
            let promise = await Promise.all([name, symbol, decimals]);
            name = promise[0];
            symbol = promise[1];
            decimals = promise[2];

            let temp = {
                id: token,
                name: name,
                symbol: symbol,
                decimals: decimals,
                price: "0",
                chainId: chainId,
                marginEnabled: true
            };

            await Token.create(temp);

            console.log("Token Added", token, chainId, symbol);
        }


        // creating pair

        let allToken = await Token.find({ marginEnabled: true, id: { $nin: [token] } }).lean();
    

        for (let i in allToken) {

            let isPairExist = await PairCreated.findOne({ token0: token, token1: allToken[i].id }).lean()

            if (isPairExist) {
                if (isPairExist.marginEnabled == true) {
                    continue
                }
                else if (isPairExist.marginEnabled == false) {
                    
                    await PairCreated.findOneAndUpdate(
                        { _id: isPairExist._id },
                        { $set: { marginEnabled: true } }
                    )
                    continue
                }
            }
            else {
                // checking opposite pair
                let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [allToken[i].id, token]);
                let id = ethers.utils.keccak256(encoder);

                let isPairExist = await PairCreated.findOne({ id: id }).lean();

                if (isPairExist) {

                    if (isPairExist.marginEnabled == true) {
                        continue
                    }
                    else if (isPairExist.marginEnabled == false) {
                        await PairCreated.findOneAndUpdate(
                            { _id: isPairExist._id },
                            { $set: { marginEnabled: true } }
                        )
                        continue
                    }

                }

            }

        }

    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleMarginEnabled", error);
    }

}

export { handleOrderExecuted, handleOrderCancelled };