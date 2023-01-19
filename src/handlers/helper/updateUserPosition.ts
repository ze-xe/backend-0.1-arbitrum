import Big from "big.js";
import { Order, User } from "../../DB/db";
import { ifUserPosition } from "../../helper/interface";










export async function updateUserPosition(getOrderDetails: any, getPairDetails: any, fillAmount: any) {
    try {

        let token = getPairDetails.token0;

        if (getOrderDetails.orderType == 0) {
            token = getPairDetails.token1;
        }

        let getUserPosition: ifUserPosition | null = await User.findOne({ id: getOrderDetails.maker, token: token });

        if (!getUserPosition) {
            return console.log(`user position not found for token0 ${token}, maker ${getOrderDetails.maker}`)
        }

        let currentInOrderBalance = new Big(getUserPosition.inOrderBalance).minus(fillAmount).toString();

        if (getOrderDetails.orderType == 0) {
            currentInOrderBalance = Big(getUserPosition.inOrderBalance).minus(Big(fillAmount).times(getOrderDetails.exchangeRate).div(Big(10).pow(18))).toString();
        }

        await User.findOneAndUpdate(
            { _id: getUserPosition._id },
            { $set: { inOrderBalance: currentInOrderBalance } }
        );

        let currentBalanceAmount = new Big(getOrderDetails.balanceAmount).minus(fillAmount);

        if (Number(currentBalanceAmount) <= Number(getPairDetails.minToken0Order)) {
            await Order.findOneAndUpdate(
                { _id: getOrderDetails._id.toString() },
                { $set: { balanceAmount: currentBalanceAmount, deleted: true, active: false } }
            );
        }
        else {
            await Order.findOneAndUpdate(
                { _id: getOrderDetails._id.toString() },
                { $set: { balanceAmount: currentBalanceAmount } }
            );
        }
    }
    catch (error) {
        console.log(`Error @ updateUserPosition from orderExecuted`)
    }
}