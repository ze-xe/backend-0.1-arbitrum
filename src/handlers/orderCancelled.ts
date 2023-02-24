import { Order, Pair, User } from "../DB/db";
import Big from "big.js";
import { ifOrderCreated, ifPair, ifUserPosition } from "../helper/interface";
import { EVENT_NAME, socketService } from "../socketIo/socket.io";
import * as sentry from "@sentry/node";
import { Action } from "../controllers/order/helper/marginValidationUserPosition";



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
        let pairDetails = await Pair.findOne({id: orderDetails.pair}).lean()! as ifPair
        // update user inOrder
        if (Number(orderDetails.action) == Action.LIMIT) {

            let token = orderDetails.token1;

            let getUser: ifUserPosition | null = await User.findOne({ id: orderDetails.maker, token: token, chainId: orderDetails.chainId }).lean();
            if (getUser) {
                let token1Amount = orderDetails.balanceAmount;
                if(pairDetails.token0 != orderDetails.token1) {
                    token1Amount = Big(orderDetails.balanceAmount).times(orderDetails.price).div(1e18).toString();
                }
                let currentInOrderBalance = Big(getUser.inOrderBalance).minus(token1Amount).toString();

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
        else if (Number(orderDetails.action) == Action.OPEN) {

            let token0Position = await User.findOne({ id: orderDetails.maker, token: orderDetails.token0 }).lean()! as any;
            let token0Amount = orderDetails.balanceAmount;

            if(pairDetails.token0 != orderDetails.token0) {
                token0Amount = Big(orderDetails.balanceAmount).div(orderDetails.price).mul(1e18).toString();
            }
            let token0InOrder = Big(token0Position?.inOrderBalance).minus(Big(token0Amount).div(Big(Number(orderDetails.leverage) - 1)));
            // console.log("token0InOrder,OPEN", token0InOrder);
            await Promise.all(
                [
                    User.findOneAndUpdate(
                        { _id: token0Position._id },
                        { $set: { inOrderBalance: token0InOrder } }
                    ),
                    Order.findOneAndUpdate(
                        { _id: orderDetails._id },
                        { $set: { cancelled: true, active: false } }
                    )
                ]
            )
        }
        else if (Number(orderDetails.action) == Action.CLOSE) {
            await Order.findOneAndUpdate(
                { _id: orderDetails._id },
                { $set: { cancelled: true, active: false } }
            )
        }

        socketService.emit(EVENT_NAME.PAIR_ORDER, {
            amount: `-${orderDetails.balanceAmount}`,
            price: orderDetails.price,
            action: orderDetails.action,
            pair: orderDetails.pair
        });
       
        socketService.emit(EVENT_NAME.CANCEL_ORDER, {
            amount: `-${orderDetails.balanceAmount}`,
            price: orderDetails.price,
            action: orderDetails.action,
            pair: orderDetails.pair
        });

        console.log(`order Cancelled, orderId : ${data[0]}`);
    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleOrderCancelled", error);
    }

}