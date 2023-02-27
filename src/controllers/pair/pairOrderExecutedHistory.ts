
import { OrderExecuted } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage"
import * as sentry from "@sentry/node";
import { parseEther } from "../../utils/utils";








export async function getPairOrderExecutedHistory(req: any, res: any) {
    try {

        let pairId: string = req.params.pairId?.toLowerCase();
        let chainId: string = req.query.chainId;

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }

        let getPairOrderHistory = await OrderExecuted.find({ pair: pairId, chainId }).sort({ blockTimestamp: -1, logIndex: -1 }).select({ pairToken0Amount: 1, pairPrice: 1, action: 1,_id: 0 }).limit(50).lean();

        const data = getPairOrderHistory.map((x)=>{
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
        console.log("Error @ getPairOrderExecutedHistory", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}