
import Big from "big.js";
import { OrderCreated, UserPosition } from "../../DB/db";
import { ifUserPosition } from "../../helper/interface";
import { getLoop, loopFillAmount } from "./getLoop";






export async function marginUpdateUserPosition(getOrderDetails: any, getPairDetails: any, fillAmount: any) {
    try {

        let userPositionToken0 = await UserPosition.findOne({ id: getOrderDetails.maker, token: getOrderDetails.token0 }).lean()! as any
        let userPositionToken1 = await UserPosition.findOne({ id: getOrderDetails.maker, token: getOrderDetails.token1 }).lean()! as any

        let totalFillAmount = Big(getOrderDetails.fillAmount).plus(fillAmount).toString();
        let orderAmount = getOrderDetails.amount;
        let borrowLimit = getOrderDetails.borrowLimit;

        let currentLoop = getLoop(totalFillAmount, borrowLimit, orderAmount);

        let amountToFill = loopFillAmount(orderAmount, borrowLimit, Math.ceil(+currentLoop).toString())

        let token0Balance = "0";
        let token1Balance = "0";
        let fillPercent = "0." + currentLoop.split('.')[1]
        if (Number(fillPercent) > 0) {
            token0Balance = Big(Big(1).minus(fillPercent)).times(amountToFill).toString();
            token1Balance = Big(fillPercent).times(amountToFill).times(Big(getOrderDetails.exchangeRate).div(Big(10).pow(18))).toString()
        }

        if (getOrderDetails.orderType == 2) {

            if (Number(fillPercent) > 0) {
                token0Balance = Big(fillPercent).times(amountToFill).toString();
                token1Balance = Big(Big(1).minus(fillPercent)).times(amountToFill).times(Big(getOrderDetails.exchangeRate).div(Big(10).pow(18))).toString()
            }
        }

        // updating userInOrder Balance 
        let token0InOrder = Big(userPositionToken0?.inOrderBalance).minus(getOrderDetails.lastInOrderToken0).plus(token0Balance).toString();
        let token1InOrder = Big(userPositionToken1.inOrderBalance).minus(getOrderDetails.lastInOrderToken1).plus(token1Balance).toString();
        let currentBalnce = Big(getOrderDetails.balanceAmount).minus(fillAmount)
        await Promise.all(
            [
                UserPosition.findOneAndUpdate(
                    { _id: userPositionToken0._id },
                    { $set: { inOrderBalance: token0InOrder } }
                ),

                UserPosition.findOneAndUpdate(
                    { _id: userPositionToken1._id },
                    { $set: { inOrderBalance: token1InOrder } }
                )
            ]
        )

        if (Number(currentBalnce) < Number(getPairDetails.minToken0Order)) {
            await OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() },
                { $set: { deleted: true, active: false, balanceAmount: currentBalnce, lastInOrderToken0: token0Balance, lastInOrderToken1: token1Balance, fillAmount: totalFillAmount } });
        }
        else {
            await OrderCreated.findOneAndUpdate(
                { _id: getOrderDetails._id.toString() },
                { $set: { lastInOrderToken0: token0Balance, lastInOrderToken1: token1Balance, fillAmount: totalFillAmount, balanceAmount: currentBalnce } }
            );
        }
    }
    catch (error) {
        console.log(`Error @ marginUpdateUserPosition`)
    }
}