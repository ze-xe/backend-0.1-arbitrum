import * as sentry from "@sentry/node";
import { Sync } from "../DB/db";



export async function handleFeesSet(data: any, argument: any) {

    try {
        let makerFee = data[0].toString();
        let takerFee = data[1].toString();

        let updateFee = await Sync.findOneAndUpdate(
            { chainId: argument.chainId },
            { $set: { makerFee: makerFee, takerFee: takerFee } },
            { upsert: true }
        );

        console.log(`Fees Set updated maker ${makerFee}, taker ${takerFee}, for chainId ${argument.chainId}`);

    }
    catch (error) {
        console.log("Error @ handleFeesSet", error);
        sentry.captureException(error)
    }

}