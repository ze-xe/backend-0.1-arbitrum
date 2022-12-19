import { PairCreated, OrderCreated, OrderExecuted, UserPosition } from "../db";
import Big from "big.js";
import { ifOrderCreated, ifPairCreated, ifUserPosition } from "../helper/interface";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import { number } from "joi";
import { getDecimals } from "../utils";





async function handleOrderExecuted(data: any, argument: any) {

    try {

        const isDuplicateTxn = await OrderExecuted.findOne({
            txnId: argument.txnId,
            blockNumber: argument.blockNumber,
            blockTimestamp: argument.blockTimestamp,
        });

        if (isDuplicateTxn) {
            return;
        }

        let id = data[0];
        let taker = data[1];
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
        argument.buy = getOrderDetails.buy;

        // updating ExchangeRateDecimal
        let exchangeRateDecimals: number | string = Number(getDecimals(getOrderDetails.exchangeRate));

        if (isNaN(exchangeRateDecimals) == false) {
            argument.exchangeRateDecimals = exchangeRateDecimals;
        }


        // updating pair orders

        socketService.emit(EVENT_NAME.PAIR_ORDER, {
            amount: `-${fillAmount}`,
            exchangeRate: getOrderDetails.exchangeRate,
            buy: getOrderDetails.buy,
            pair: getOrderDetails.pair
        });

        // updating pair history
        socketService.emit(EVENT_NAME.PAIR_HISTORY, {
            amount: fillAmount,
            exchangeRate: getOrderDetails.exchangeRate,
            buy: getOrderDetails.buy,
            pair: getOrderDetails.pair
        })

        OrderExecuted.create(argument);
        let priceDiff = new Big(getOrderDetails.exchangeRate).minus(getPairDetails.exchangeRate).toString();

        await PairCreated.findOneAndUpdate(
            { _id: getPairDetails._id.toString() },
            { $set: { exchangeRate: getOrderDetails.exchangeRate, priceDiff: priceDiff, exchangeRateDecimals: argument.exchangeRateDecimals } }
        );

        if (getOrderDetails.buy == false) {
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
        else if (getOrderDetails.buy == true) {
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
        console.log("Error @ handleOrderExecuted", error);
    }

}


async function handleOrderCancelled(data: any) {

    let id = data[0];

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
        buy: orderDetails.buy,
        pair: orderDetails.pair
    });
    // update user inOrder
    if (orderDetails.buy == false) {
        let getUser: ifUserPosition | null = await UserPosition.findOne({ id: orderDetails.maker, token: orderDetails.token0, chainId: orderDetails.chainId }).lean();
        if (getUser) {
            let currentInOrderBalance = Big(getUser.inOrderBalance).minus(orderDetails.balanceAmount).toString();

            await UserPosition.findOneAndUpdate(
                { id: orderDetails.maker, token: orderDetails.token0, chainId: orderDetails.chainId },
                { $set: { inOrderBalance: currentInOrderBalance } }
            );

        }

    }
    else if (orderDetails.buy == true) {
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


export { handleOrderExecuted, handleOrderCancelled };