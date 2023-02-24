import { Pair, Order, OrderExecuted, } from "../DB/db";
import Big from "big.js";
import { ifOrderCreated, ifPair } from "../helper/interface";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import * as sentry from "@sentry/node";
import { getLoop, loopFillAmount } from "./helper/getLoop";
import { updateUserPosition } from "./helper/updateUserPosition";
import { updateUserPositionOpen } from "./helper/updateUserPositionOpen";
import { getDecimals } from "../utils/getDecimal";
import { Action } from "../controllers/order/helper/marginValidationUserPosition";
import { updateOrderClose } from "./helper/updateOrderClose";


export async function handleOrderExecuted(data: any, argument: any) {

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

        let getOrderDetails: ifOrderCreated = await Order.findOne({ id: id, chainId: argument.chainId }).lean();

        if (!getOrderDetails) {
            return console.log("OrderId not found @ execute", id);
        }

        let getPairDetails: ifPair | null = await Pair.findOne({ id: getOrderDetails.pair, chainId: getOrderDetails.chainId, active: true }).lean();

        if (!getPairDetails) {
            return console.log(`Pair Id not found in order Executed`);
        }
        argument.pairToken0Amount = fillAmount;

        let token1Amount = Big(fillAmount).mul(getOrderDetails.price).div(1e18);

        if ((getOrderDetails.action == Action.LIMIT || getOrderDetails.action == Action.OPEN) && getPairDetails.token0 == getOrderDetails.token1) {
            argument.pairToken0Amount = token1Amount;
        }

        if (getOrderDetails.action == Action.CLOSE && getPairDetails.token0 == getOrderDetails.token0) {
            argument.pairToken0Amount = Big(fillAmount).div(getOrderDetails.price).mul(1e18);
        }

        argument.price = getOrderDetails.price;
        argument.pairPrice = getOrderDetails.pairPrice;
        argument.pair = getOrderDetails.pair;
        argument.action = getOrderDetails.action;
        argument.position = getOrderDetails.position;
        argument.leverage = getOrderDetails.leverage;
        argument.priceDecimals = Number(getPairDetails.priceDecimals);



        // updating ExchangeRateDecimal
        let priceDecimals: number | string = Number(getDecimals(getOrderDetails.pairPrice));

        if (isNaN(priceDecimals) == false) {
            argument.priceDecimals = priceDecimals;
        }

        await OrderExecuted.create(argument);
        let priceDiff = new Big(getOrderDetails.pairPrice).minus(getPairDetails.price).toString();

        await Pair.findOneAndUpdate(
            { _id: getPairDetails._id.toString() },
            { $set: { price: getOrderDetails.pairPrice, priceDiff: priceDiff, priceDecimals: argument.priceDecimals } }
        );
        // updating userPosition
        if (Number(getOrderDetails.action) == Action.LIMIT) {
            await updateUserPosition(getOrderDetails, getPairDetails, fillAmount)
        }
        else if (Number(getOrderDetails.action) == Action.OPEN) {
            await updateUserPositionOpen(getOrderDetails, getPairDetails, fillAmount)
        }
        else if (Number(getOrderDetails.action) == Action.CLOSE) {
            await updateOrderClose(getOrderDetails, getPairDetails, fillAmount);
        }
        // updating pair orders

        socketService.emit(EVENT_NAME.PAIR_ORDER, {
            amount: `-${fillAmount}`,
            price: getOrderDetails.price,
            action: getOrderDetails.action,
            position: getOrderDetails.position,
            pair: getOrderDetails.pair
        });

        // updating pair history
        socketService.emit(EVENT_NAME.PAIR_HISTORY, {
            amount: fillAmount,
            price: getOrderDetails.price,
            action: getOrderDetails.action,
            position: getOrderDetails.position,
            pair: getOrderDetails.pair
        })

        console.log("Order Executed", taker, fillAmount, id, getOrderDetails.action);

    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleOrderExecuted", error);
    }

}
