import * as sentry from "@sentry/node";
import { Order } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";
import { parseEther } from "../../utils/utils";





export async function getOrderCancelled(req: any, res: any) {
    try {
        let pairId: string = req.params.pairId?.toLowerCase();
        let maker: string = req.params.maker?.toLowerCase();
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
        const getOrderCancelledDoc = await Order.find({ maker: maker, pair: pairId, chainId, cancelled: true }).sort({ createdAt: -1 }).select({ balanceAmount: 1, pairPrice: 1, action: 1, _id: 0 }).lean();

        const data = getOrderCancelledDoc.map(x => {
            return {
                price: parseEther(x.pairPrice),
                amount: parseEther(x.balanceAmount),
                action: x.action
            }
        })
        return res.status(200).send({ status: true, data: data });
    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getMatchedMarketOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}
