import { PairCreated, OrderCreated, OrderExecuted, UserPosition} from "../db";
import Big from "big.js";
import { ifOrderCreated, ifPairCreated, ifUserPosition } from "../helper/interface";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";

import { getDecimals} from "../utils/utils";
import { sentry } from "../../app";
import { getLoop, loopFillAmount } from "./helper/getLoop";
import { updateUserPosition } from "./helper/updateUserPosition";
import { marginUpdateUserPosition } from "./helper/marginUpdateUserPosition";

// export async function handleOrderExecuted(data: any, argument: any) {

//     try {

//         const isDuplicateTxn = await OrderExecuted.findOne({
//             txnId: argument.txnId,
//             blockNumber: argument.blockNumber,
//             blockTimestamp: argument.blockTimestamp,
//             logIndex: argument.logIndex
//         });

//         if (isDuplicateTxn) {
//             console.log("OrderExecute duplicate, id :", data[0].toLowerCase())
//             return;
//         }

//         let id = data[0]?.toLowerCase();
//         let taker = data[1]?.toLowerCase();
//         let fillAmount = data[2].toString();
//         argument.id = id;
//         argument.taker = taker;
//         argument.fillAmount = fillAmount;

//         let getOrderDetails: ifOrderCreated = await OrderCreated.findOne({ id: id, chainId: argument.chainId }).lean();

//         if (!getOrderDetails) {
//             return console.log("OrderId not found @ execute", id);
//         }

//         let getPairDetails: ifPairCreated | null = await PairCreated.findOne({ id: getOrderDetails.pair, chainId: getOrderDetails.chainId, active: true }).lean();

//         if (!getPairDetails) {
//             return console.log(`Pair Id not found in order Executed`);
//         }
//         argument.exchangeRate = getOrderDetails.exchangeRate;
//         argument.pair = getOrderDetails.pair;
//         argument.exchangeRateDecimals = Number(getPairDetails.exchangeRateDecimals);
//         argument.orderType = getOrderDetails.orderType;

//         // updating ExchangeRateDecimal
//         let exchangeRateDecimals: number | string = Number(getDecimals(getOrderDetails.exchangeRate));

//         if (isNaN(exchangeRateDecimals) == false) {
//             argument.exchangeRateDecimals = exchangeRateDecimals;
//         }

//         await OrderExecuted.create(argument);
//         let priceDiff = new Big(getOrderDetails.exchangeRate).minus(getPairDetails.exchangeRate).toString();

//         await PairCreated.findOneAndUpdate(
//             { _id: getPairDetails._id.toString() },
//             { $set: { exchangeRate: getOrderDetails.exchangeRate, priceDiff: priceDiff, exchangeRateDecimals: argument.exchangeRateDecimals } }
//         );

//         if (getOrderDetails.orderType == 1 || getOrderDetails.orderType == 3) {
//             // for maker

//             let token0 = getPairDetails.token0;

//             if (getOrderDetails.orderType == 1) {
//                 let getUserPosition0: ifUserPosition | null = await UserPosition.findOne({ id: getOrderDetails.maker, token: token0 });

//                 if (!getUserPosition0) {
//                     return console.log(`user position not found for token0 ${token0}, make ${getOrderDetails.maker}`)
//                 }

//                 let currentInOrderBalance0 = new Big(getUserPosition0.inOrderBalance).minus(fillAmount).toString();

//                 await UserPosition.findOneAndUpdate(
//                     { id: getOrderDetails.maker, token: token0 },
//                     { $set: { inOrderBalance: currentInOrderBalance0 } }
//                 );

//                 let currentFillAmount = new Big(getOrderDetails.balanceAmount).minus(fillAmount);

//                 if (Number(currentFillAmount) <= Number(getPairDetails.minToken0Order)) {
//                     await OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() },
//                         { $set: { balanceAmount: currentFillAmount, deleted: true, active: false } });
//                 }
//                 else {
//                     await OrderCreated.findOneAndUpdate(
//                         { _id: getOrderDetails._id.toString() },
//                         { $set: { balanceAmount: currentFillAmount } }
//                     );
//                 }
//             }
//             else if (getOrderDetails.orderType == 3) {

//                 let userPositionToken0 = await UserPosition.findOne({ id: getOrderDetails.maker, token: getOrderDetails.token0 }).lean()! as any
//                 let userPositionToken1 = await UserPosition.findOne({ id: getOrderDetails.maker, token: getOrderDetails.token1 }).lean()! as any

//                 let totalFillAmount = Big(getOrderDetails.fillAmount).plus(fillAmount).toString();
//                 let orderAmount = getOrderDetails.amount;
//                 let borrowLimit = getOrderDetails.borrowLimit;

//                 let currentLoop = getLoop(totalFillAmount, borrowLimit, orderAmount);

//                 let amountToFill = loopFillAmount(orderAmount, borrowLimit, Math.ceil(+currentLoop).toString())

//                 let token0Balance = "0";
//                 let token1Balance = "0";
//                 let fillPercent = "0." + currentLoop.split('.')[1]
//                 if (Number(fillPercent) > 0) {
//                     token0Balance = Big(Big(1).minus(fillPercent)).times(amountToFill).toString();
//                     token1Balance = Big(fillPercent).times(amountToFill).times(Big(getOrderDetails.exchangeRate).div(Big(10).pow(18))).toString()
//                 }

//                 // updating userInOrder Balance 
//                 let token0InOrder = Big(userPositionToken0?.inOrderBalance).minus(getOrderDetails.lastInOrderToken0).plus(token0Balance).toString();
//                 let token1InOrder = Big(userPositionToken1.inOrderBalance).minus(getOrderDetails.lastInOrderToken1).plus(token1Balance).toString();
//                 let currentBalnce = Big(getOrderDetails.balanceAmount).minus(fillAmount)
//                 await Promise.all(
//                     [
//                         UserPosition.findOneAndUpdate(
//                             { id: getOrderDetails.maker, token: getOrderDetails.token0 },
//                             { $set: { inOrderBalance: token0InOrder } }
//                         ),

//                         UserPosition.findOneAndUpdate(
//                             { id: getOrderDetails.maker, token: getOrderDetails.token1 },
//                             { $set: { inOrderBalance: token1InOrder } }
//                         )
//                     ]
//                 )

//                 if (Number(currentBalnce) < Number(getPairDetails.minToken0Order)) {
//                     await OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() },
//                         { $set: { deleted: true, active: false, balanceAmount: currentBalnce, lastInOrderToken0: token0Balance, lastInOrderToken1: token1Balance, fillAmount: totalFillAmount } });
//                 }
//                 else {
//                     await OrderCreated.findOneAndUpdate(
//                         { _id: getOrderDetails._id.toString() },
//                         { $set: { lastInOrderToken0: token0Balance, lastInOrderToken1: token1Balance, fillAmount: totalFillAmount, balanceAmount: currentBalnce } }
//                     );
//                 }

//             }

//         }
//         else if (getOrderDetails.orderType == 0 || getOrderDetails.orderType == 2) {
//             // for maker

//             let token1 = getPairDetails.token1;

//             if (getOrderDetails.orderType == 0) {
//                 let getUserPosition1: ifUserPosition | null = await UserPosition.findOne({ id: getOrderDetails.maker, token: token1 });

//                 if (!getUserPosition1) {
//                     return console.log(`User Position not found ${getOrderDetails.maker}, ${token1}`)
//                 }

//                 let currentBalance1 = Big(getUserPosition1.inOrderBalance).minus(Big(fillAmount).times(getOrderDetails.exchangeRate).div(Big(10).pow(18))).toString();

//                 await UserPosition.findOneAndUpdate(
//                     { id: getOrderDetails.maker, token: token1 },
//                     { $set: { inOrderBalance: currentBalance1 } }
//                 );

//                 let currentFillAmount = new Big(getOrderDetails.balanceAmount).minus(fillAmount);

//                 if (Number(currentFillAmount) < Number(getPairDetails.minToken0Order)) {
//                     await OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() },
//                         { $set: { deleted: true, active: false, balanceAmount: currentFillAmount } });
//                 }
//                 else {
//                     await OrderCreated.findOneAndUpdate(
//                         { _id: getOrderDetails._id.toString() },
//                         { $set: { balanceAmount: currentFillAmount } }
//                     );
//                 }
//             }

//             else if (getOrderDetails.orderType == 2) {

//                 let userPositionToken0 = await UserPosition.findOne({ id: getOrderDetails.maker, token: getOrderDetails.token0 }).lean()! as any
//                 let userPositionToken1 = await UserPosition.findOne({ id: getOrderDetails.maker, token: getOrderDetails.token1 }).lean()! as any


//                 let totalFillAmount = Big(getOrderDetails.fillAmount).plus(fillAmount).toString();
//                 let orderAmount = getOrderDetails.amount;
//                 let borrowLimit = getOrderDetails.borrowLimit;
//                 let currentBalnce = Big(getOrderDetails.balanceAmount).minus(fillAmount)
//                 let currentLoop = getLoop(totalFillAmount, borrowLimit, orderAmount);

//                 let amountToFill = loopFillAmount(orderAmount, borrowLimit, Math.ceil(+currentLoop).toString())

//                 let token0Balance = "0";
//                 let token1Balance = "0";
//                 let fillPercent = "0." + currentLoop.split('.')[1]
//                 if (Number(fillPercent) > 0) {
//                     token0Balance = Big(fillPercent).times(amountToFill).toString();
//                     token1Balance = Big(Big(1).minus(fillPercent)).times(amountToFill).times(Big(getOrderDetails.exchangeRate).div(Big(10).pow(18))).toString()
//                 }

//                 // updating userInOrder Balance 
//                 let token0InOrder = Big(userPositionToken0?.inOrderBalance).minus(getOrderDetails.lastInOrderToken0).plus(token0Balance).toString();
//                 let token1InOrder = Big(userPositionToken1.inOrderBalance).minus(getOrderDetails.lastInOrderToken1).plus(token1Balance).toString();

//                 await Promise.all(
//                     [
//                         UserPosition.findOneAndUpdate(
//                             { id: getOrderDetails.maker, token: getOrderDetails.token0 },
//                             { $set: { inOrderBalance: token0InOrder } }
//                         ),

//                         UserPosition.findOneAndUpdate(
//                             { id: getOrderDetails.maker, token: getOrderDetails.token1 },
//                             { $set: { inOrderBalance: token1InOrder } }
//                         )
//                     ]
//                 )

//                 if (Number(currentBalnce) < Number(getPairDetails.minToken0Order)) {
//                     await OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() },
//                         { $set: { deleted: true, active: false, balanceAmount: currentBalnce, lastInOrderToken0: token0Balance, lastInOrderToken1: token1Balance, fillAmount: totalFillAmount } });
//                 }
//                 else {
//                     await OrderCreated.findOneAndUpdate(
//                         { _id: getOrderDetails._id.toString() },
//                         { $set: { lastInOrderToken0: token0Balance, lastInOrderToken1: token1Balance, fillAmount: totalFillAmount, balanceAmount: currentBalnce } }
//                     );
//                 }

//             }


//         }

//         // updating pair orders

//         socketService.emit(EVENT_NAME.PAIR_ORDER, {
//             amount: `-${fillAmount}`,
//             exchangeRate: getOrderDetails.exchangeRate,
//             orderType: getOrderDetails.orderType,
//             pair: getOrderDetails.pair
//         });

//         // updating pair history
//         socketService.emit(EVENT_NAME.PAIR_HISTORY, {
//             amount: fillAmount,
//             exchangeRate: getOrderDetails.exchangeRate,
//             orderType: getOrderDetails.orderType,
//             pair: getOrderDetails.pair
//         })

//         console.log("Order Executed", taker, fillAmount, id);

//     }
//     catch (error) {
//         sentry.captureException(error)
//         console.log("Error @ handleOrderExecuted", error);
//     }

// }
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
