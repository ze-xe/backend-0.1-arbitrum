

import { OrderCreated, OrderExecuted, UserPosition } from "../db";
import { errorMessage } from "../helper/errorMessage";
import { ifUserPosition } from "../helper/interface";
import { parseEther } from "../utils";




async function getUserPlacedOrders(req: any, res: any) {

    try {

        let maker: string = req.params.maker;
        let pairId: string = req.params.pairId;
        let chainId: string = req.query.chainId;
        if (!maker) {
            return res.status(400).send({ status: false, error: errorMessage.maker });
        }

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }

        const getMakerOrders = await OrderCreated.find({ maker: maker, pair: pairId, deleted: false, cancelled: false, active: true, chainId: chainId }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ buy: 1, exchangeRate: 1, amount: 1, _id: 0, id: 1 }).lean();

        return res.status(200).send({ status: true, data: getMakerOrders });
    }
    catch (error: any) {
        console.log("Error @ getUserPlacedOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }

}



async function getUserOrderHistory(req: any, res: any) {
    try {

        let taker: string = req.params.taker;
        let pairId: string = req.params.pairId;
        let chainId: string = req.query.chainId;
        if (!taker) {
            return res.status(400).send({ status: false, error: errorMessage.taker });
        }

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }
        const getOrderHistory = await OrderExecuted.find({ taker: taker, pair: pairId, chainId: chainId }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ buy: 1, exchangeRate: 1, fillAmount: 1, _id: 0 }).limit(50).lean();

        return res.status(200).send({ status: true, data: getOrderHistory });
    }
    catch (error: any) {
        console.log("Error @ getUserOrderHistory", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}




async function getOrderCancelled(req: any, res: any) {
    try {
        let pairId: string = req.params.pairId;
        let maker: string = req.params.maker;
        let chainId: string = req.query.chainId;

        if (!maker) {
            return res.status(400).send({ status: false, error: errorMessage.maker });
        }

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }
        let getOrderCancelledDoc = await OrderCreated.find({ maker: maker, pair: pairId, chainId, cancelled: true }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ balanceAmount: 1, exchangeRate: 1, buy: 1, _id: 0 }).lean();

        return res.status(200).send({ status: true, data: getOrderCancelledDoc });
    }
    catch (error: any) {
        console.log("Error @ getMatchedMarketOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}


async function getUserInOrderBalance(req: any, res: any) {
    try {

        let token: string = req.params.token;
        let chainId: string = req.query.chainId;
        let maker: string = req.params.maker;

        if (!token) {
            return res.status(400).send({ status: false, error: errorMessage.token });
        }

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }

        if (!maker) {
            return res.status(400).send({ status: false, error: errorMessage.maker });
        }

        let userInOrder: any[] = await UserPosition.find({ token: token, id: maker, chainId: chainId }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0, balance: 0 }).lean();
        if (userInOrder.length > 0) {

            userInOrder[0].inOrderBalance = parseEther(userInOrder[0].inOrderBalance);
        }
        return res.status(200).send({ status: true, data: userInOrder });

    }
    catch (error: any) {
        console.log("Error @ getMatchedMarketOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}
export { getUserPlacedOrders, getUserOrderHistory, getOrderCancelled, getUserInOrderBalance };