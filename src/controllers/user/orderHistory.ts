

import * as sentry from "@sentry/node";
import { OrderExecuted } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";





export async function getUserOrderHistory(req: any, res: any) {
    try {

        let taker: string = req.params.taker?.toLowerCase();
        let pairId: string = req.params.pairId?.toLowerCase();
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
        const getOrderHistory = await OrderExecuted.find({ taker: taker, pair: pairId, chainId: chainId }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ orderType: 1, exchangeRate: 1, fillAmount: 1, _id: 0 }).limit(50).lean();

        return res.status(200).send({ status: true, data: getOrderHistory });
    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getUserOrderHistory", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}