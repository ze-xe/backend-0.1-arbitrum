import { PairCreated, OrderCreated, OrderExecuted, UserPosition} from "../DB/db";
import Big from "big.js";
import { ifOrderCreated, ifPairCreated, ifUserPosition } from "../helper/interface";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import { sentry } from "../../app";
import { getLoop, loopFillAmount } from "./helper/getLoop";
import { updateUserPosition } from "./helper/updateUserPosition";
import { marginUpdateUserPosition } from "./helper/marginUpdateUserPosition";
import { getDecimals } from "../utils/getDecimal";


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

        let getOrderDetails: ifOrderCreated = await OrderCreated.findOne({ id: id, chainId: argument.chainId }).lean();

        if (!getOrderDetails) {
            return console.log("OrderId not found @ execute", id);
        }

        let getPairDetails: ifPairCreated | null = await PairCreated.findOne({ id: getOrderDetails.pair, chainId: getOrderDetails.chainId, active: true }).lean();

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

        await OrderExecuted.create(argument);
        let priceDiff = new Big(getOrderDetails.exchangeRate).minus(getPairDetails.exchangeRate).toString();

        await PairCreated.findOneAndUpdate(
            { _id: getPairDetails._id.toString() },
            { $set: { exchangeRate: getOrderDetails.exchangeRate, priceDiff: priceDiff, exchangeRateDecimals: argument.exchangeRateDecimals } }
        );
            // updating userPosition
        if (getOrderDetails.orderType == 1 || getOrderDetails.orderType == 0) {
            await updateUserPosition(getOrderDetails, getPairDetails, fillAmount)
        }
        else if (getOrderDetails.orderType == 3 || getOrderDetails.orderType == 2) { 
            await marginUpdateUserPosition(getOrderDetails, getPairDetails, fillAmount)
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

        console.log("Order Executed", taker, fillAmount, id);

    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleOrderExecuted", error);
    }

}
