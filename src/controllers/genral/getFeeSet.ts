import * as sentry from "@sentry/node";
import { Sync } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";




export async function getFeeSet(req: any, res: any) {

    try {
        let chainId = req.query.chainId;
        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }
        const getFee = await Sync.find({ chainId: chainId }).select({ _id: 0, makerFee: 1, takerFee: 1 }).lean();

        return res.status(200).send({ status: true, data: getFee });

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getFeeSet", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}



