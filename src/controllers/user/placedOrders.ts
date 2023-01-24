import * as sentry from "@sentry/node";
import { Order } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";

export async function getUserPlacedOrders(req: any, res: any) {

    try {

        let maker: string = req.params.maker?.toLowerCase();
        let pairId: string = req.params.pairId?.toLowerCase();
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

        const getMakerOrders = await Order.find({ maker: maker, pair: pairId, deleted: false, cancelled: false, active: true, chainId: chainId }).sort({ blockTimestamp: -1, createdAt: -1 }).lean();

        let data = getMakerOrders.map((order: any) => {
            return {
                signature: order.signature,
                id: order.id,
                value: {
                    maker: order.maker,
                    token0: order.token0,
                    token1: order.token1,
                    amount: order.amount,
                    orderType: order.orderType,
                    salt: order.salt,
                    exchangeRate: order.exchangeRate,
                    borrowLimit: order.borrowLimit,
                    loops: order.loops
                }
            }
        });



        return res.status(200).send({ status: true, data: data });
    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getUserPlacedOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }

}