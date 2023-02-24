
import Big from "big.js";
import { Order, User } from "../../DB/db";







export async function updateOrderClose(getOrderDetails: any, getPairDetails: any, fillAmount: any) {
    try {

        if (getPairDetails.token0 == getOrderDetails.token0) {
            fillAmount = Big(fillAmount).div(getOrderDetails.price).mul(1e18);;
        }
        // updating order balanceAmount in terms of token0;
        let currentBalnce = Big(getOrderDetails.balanceAmount).minus((fillAmount));

        if (Number(currentBalnce) < Number(getPairDetails.minToken0Order)) {
            await Order.findOneAndUpdate({ _id: getOrderDetails._id.toString() },
                { $set: { deleted: true, active: false, balanceAmount: currentBalnce } });
        }
        else {
            await Order.findOneAndUpdate(
                { _id: getOrderDetails._id.toString() },
                { $set: { balanceAmount: currentBalnce } }
            );
        }
    }
    catch (error) {
        console.log(`Error @ marginUpdateUserPosition`)
    }
}