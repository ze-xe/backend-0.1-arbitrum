import { Order, User } from "../DB/db";
import Big from "big.js";
import { ifOrderCreated, ifUserPosition } from "../helper/interface";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import { sentry } from "../../app";



export async function handleOrderCancelled(data: any) {

    try {
        let id = data[0].toLowerCase();

        let orderDetails: ifOrderCreated | null = await Order.findOne({ id: id }).lean();

        if (!orderDetails) {
            return console.log(`Order cancelled OrderId not found ${data[0]}`);
        }

        if (orderDetails.cancelled == true) {
            return console.log("Order is already cancelled");
        }
    
        // update user inOrder
        if (orderDetails.orderType == 1 || orderDetails.orderType == 0) {

            let token = orderDetails.token0;

            if (orderDetails.orderType == 0) {
                token = orderDetails.token1
            }
            let getUser: ifUserPosition | null = await User.findOne({ id: orderDetails.maker, token: token, chainId: orderDetails.chainId }).lean();
            if (getUser) {

                let currentInOrderBalance = Big(getUser.inOrderBalance).minus(orderDetails.balanceAmount).toString();

                if (orderDetails.orderType == 0) {
                    currentInOrderBalance = Big(getUser.inOrderBalance).minus(Big(orderDetails.balanceAmount).times(orderDetails.exchangeRate).div(Big(10).pow(18))).toString();
                }

                await Promise.all(
                    [
                        User.findOneAndUpdate(
                            { _id: getUser._id },
                            { $set: { inOrderBalance: currentInOrderBalance } }
                        ),
                        Order.findOneAndUpdate(
                            { _id: orderDetails._id },
                            { $set: { cancelled: true, active: false } }
                        )
                    ]
                )
            }
        }
        else if (orderDetails.orderType == 2 || orderDetails.orderType == 3) {

            let token0Position = await User.findOne({ id: orderDetails.maker, token: orderDetails.token0 }).lean()! as any;
            let token1Position = await User.findOne({ id: orderDetails.maker, token: orderDetails.token1 }).lean()! as any;
            let token0InOrder = Big(token0Position?.inOrderBalance).minus(orderDetails.lastInOrderToken0).toString();
            let token1InOrder = Big(token1Position?.inOrderBalance).minus(orderDetails.lastInOrderToken1).toString();

            await Promise.all(
                [
                    User.findOneAndUpdate(
                        { _id: token0Position._id },
                        { $set: { inOrderBalance: token0InOrder } }
                    ),
                    User.findOneAndUpdate(
                        { _id: token1Position._id },
                        { $set: { inOrderBalance: token1InOrder } }
                    ),
                    Order.findOneAndUpdate(
                        { _id: orderDetails._id },
                        { $set: { cancelled: true, active: false } }
                    )
                ]
            )
        }

        socketService.emit(EVENT_NAME.PAIR_ORDER, {
            amount: `-${orderDetails.balanceAmount}`,
            exchangeRate: orderDetails.exchangeRate,
            orderType: orderDetails.orderType,
            pair: orderDetails.pair
        });

        socketService.emit(EVENT_NAME.CANCEL_ORDER, {
            amount: `-${orderDetails.balanceAmount}`,
            exchangeRate: orderDetails.exchangeRate,
            orderType: orderDetails.orderType,
            pair: orderDetails.pair
        });

        console.log(`order Cancelled, orderId : ${data[0]}`);
    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleOrderCancelled", error);
    }

}