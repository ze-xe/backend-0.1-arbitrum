
import { sentry } from "../../../app";
import { PairCreated } from "../../db";
import { errorMessage } from "../../helper/errorMessage";



export async function getSymbol(req: any, res: any) {
    try {

        let symbol = req.query.symbol;

        let symbolDetails = await PairCreated.findOne({ symbol: symbol, active: true }).lean();

        if (!symbolDetails) {
            return res.status(404).send({ status: false, data: errorMessage.symbol })
        }

        let data = {
            symbol: symbolDetails.symbol,
            ticker: symbolDetails.id
        }

        return res.status(200).send({ status: true, data: data })
    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getSymbol", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}