import { sentry } from "../../app";
import { Token } from "../db";
import { errorMessage } from "../helper/errorMessage";



async function getAllTokens(req: any, res: any) {

    try {
        let chainId = req.query.chainId;
        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }
        const getAllTokens = await Token.find({ chainId: chainId }).select({ _id: 0, name: 1, symbol: 1, decimals: 1, id: 1 }).lean();

        return res.status(200).send({ status: true, data: getAllTokens });

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getAllTokens", error);
        return res.status(500).send({ status: false, error: error.message });
    }

}







export { getAllTokens };


