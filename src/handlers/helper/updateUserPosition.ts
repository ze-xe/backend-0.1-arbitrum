import Big from "big.js";
import { Order, User } from "../../DB/db";
import { ifUserPosition } from "../../helper/interface";










export async function updateUserPosition(getOrderDetails: any, getPairDetails: any, fillAmount: any) {
    try {

        let token = getOrderDetails.token1;
        let token1Amount = Big(fillAmount).mul(getOrderDetails.price).div(1e18);

        let getUserPosition: ifUserPosition | null = await User.findOne({ id: getOrderDetails.maker, token: token });

        if (!getUserPosition) {
            return console.log(`user position not found for token0 ${token}, maker ${getOrderDetails.maker}`)
        }

        let currentInOrderBalance = new Big(getUserPosition.inOrderBalance).minus(token1Amount).toString();

        await User.findOneAndUpdate(
            { _id: getUserPosition._id },
            { $set: { inOrderBalance: currentInOrderBalance } }
        );

        if (getPairDetails.token0 == getOrderDetails.token1){
            fillAmount = token1Amount;
        }
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