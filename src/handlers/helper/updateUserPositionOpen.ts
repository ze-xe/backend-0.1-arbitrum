
import Big from "big.js";
import { Order, User } from "../../DB/db";







export async function updateUserPositionOpen(getOrderDetails: any, getPairDetails: any, fillAmount: any) {
    try {

        let userPositionToken0 = await User.findOne({ id: getOrderDetails.maker, token: getOrderDetails.token0 }).lean()! as any

        let perc = Big(fillAmount).div(Big(getOrderDetails.token0Amount).mul(getOrderDetails.leverage-1)).toNumber();
        let token0InOrder = Big(userPositionToken0.inOrderBalance).minus(Big(perc).mul(getOrderDetails.token0Amount));

        // updating userInOrder Balance 

        if (getPairDetails.token0 == getOrderDetails.token1){
            fillAmount = Big(fillAmount).mul(getOrderDetails.price).div(1e18);
        }
        let currentBalnce = Big(getOrderDetails.balanceAmount).minus(fillAmount)
       
        await User.findOneAndUpdate(
            { _id: userPositionToken0._id },
            { $set: { inOrderBalance: token0InOrder } }
        );

       
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
        console.log(`Error @ marginUpdateUserPosition`,error)
    }
}