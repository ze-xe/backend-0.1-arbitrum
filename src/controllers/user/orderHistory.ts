

import * as sentry from "@sentry/node";
import { OrderExecuted } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";
import { parseEther } from "../../utils/utils";





export async function getUserOrderHistory(req: any, res: any) {
    try {

        let taker: string = req.params.taker?.toLowerCase();
        let pairId: string = req.params.pairId?.toLowerCase();
        let chainId: string = req.query.chainId;
        if (!taker) {
            return res.status(400).send({ status: false, error: errorMessage.TAKER_REQUIRED });
        }

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.PAIR_ID_REQUIRED_OR_INVALID });
        }

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.CHAIN_ID_REQUIRED });
        }
        const getOrderHistory = await OrderExecuted.find({ taker: taker, pair: pairId, chainId: chainId }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ action: 1, pairPrice: 1, pairToken0Amount: 1, _id: 0 }).limit(50).lean();

        const data = getOrderHistory.map(x=>{
            return {
                fillAmount : parseEther(x.pairToken0Amount),
                price: parseEther(x.pairPrice),
                action: x.action

            }
        })
        return res.status(200).send({ status: true, data: data });
    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getUserOrderHistory", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}