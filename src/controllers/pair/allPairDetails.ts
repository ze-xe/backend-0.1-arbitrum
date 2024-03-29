
import { ifPair } from "../../helper/interface";

import { Pair, Token } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage"
import * as sentry from "@sentry/node";









export async function getAllPairDetails(req: any, res: any) {

    try {

        let chainId: string = req.query.chainId;

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }
        let allPairs: ifPair[] = await Pair.find({ chainId: chainId, active: true }).lean();

        let data: any = [];

        let promiseTokens: any = [];

        for (let i in allPairs) {

            let token0 = Token.findOne({ id: allPairs[i].token0, active: true }).select({ name: 1, symbol: 1, decimals: 1, _id: 0, id: 1 }).lean();
            let token1 = Token.findOne({ id: allPairs[i].token1, active: true }).select({ name: 1, symbol: 1, decimals: 1, _id: 0, id: 1 }).lean();
            promiseTokens.push(token0, token1);
        }

        promiseTokens = await Promise.all(promiseTokens);

        for (let i = 0; i < allPairs.length; i++) {

            let token0 = promiseTokens[2 * i];
            let token1 = promiseTokens[2 * i + 1];
            let temp = {

                id: allPairs[i].id,
                exchangeRate: allPairs[i].exchangeRate,
                exchangeRateDecimals: allPairs[i].exchangeRateDecimals,
                priceDiff: allPairs[i].priceDiff,
                marginEnabeled: allPairs[i].marginEnabled,
                minToken0Order: allPairs[i].minToken0Order,
                tokens: [token0, token1],

            };

            data.push(temp);
        }

        res.status(200).send({ status: true, data: data });

    }
    catch (error: any) {
        console.log("Error @ getAllPairDetails", error);
        sentry.captureException(error)
        res.status(500).send({ status: false, error: error.message });
    }
}