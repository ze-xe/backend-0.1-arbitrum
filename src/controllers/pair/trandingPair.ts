import Big from "big.js";
import * as sentry from "@sentry/node";
import { connect, OrderExecuted, Pair, Token } from "../../DB/db";
import { ifPair } from "../../helper/interface";











export async function getPairTrandingPair(req: any, res: any) {

    try {

        // let chainId = req.query.chainId;
        let getPairs: ifPair[] = await Pair.find({ active: true }).lean()!

        let interval = 24 * 60 * 60 * 1000;

        let data: any = [];

        for (let i in getPairs) {

            let getOrderExecuted = await OrderExecuted.aggregate(
                [
                    {
                        $match: {
                            $and: [
                                { pair: getPairs[i].id },
                                { blockTimestamp: { $gte: Date.now() - interval } }
                            ]
                        }
                    },
                    {
                        $sort: { blockTimestamp: -1, logIndex: -1 }
                    },
                    {
                        $addFields: {
                            amount: { $toDecimal: "$fillAmount" },
                        }
                    },
                    {
                        $facet: {

                            "exchangeRate": [
                                {
                                    $group: {
                                        _id: null,
                                        first: { $first: "$exchangeRate" },
                                        last: { $last: "$exchangeRate" }

                                    }
                                },
                                { $project: { first: 1, last: 1, _id: 0 } }
                            ],
                            "volume": [
                                {
                                    $group: {
                                        _id: null,
                                        volume: { $sum: "$amount" },
                                        count: { $sum: 1 }
                                    }
                                }
                            ]
                        }
                    }

                ]
            );


            if (getOrderExecuted[0].exchangeRate.length <= 0) {

                let temp = {
                    pairId: getPairs[i].id,
                    trade: 0
                };

                data.push(temp);

            }
            else {
                let changeInER = getOrderExecuted[0].exchangeRate[0].first - getOrderExecuted[0].exchangeRate[0].last;

                let trade = Big(getOrderExecuted[0].exchangeRate[0].first).times(getOrderExecuted[0].volume[0].volume).div(1e36).toString()

                let temp = {
                    pairId: getPairs[i].id,
                    trade: Number(trade)
                };

                data.push(temp);
            }

        }

        data = data.sort((a: any, b: any) => b.trade - a.trade)
        let trandingPair: any = []

        for (let i in data) {

            let allPairs: ifPair = await Pair.findOne({ id: data[i].pairId, active: true }).sort({ createdAt: -1 }).lean();


            let promiseTokens: any = [];

            for (let i in allPairs) {

                let token0 = Token.findOne({ id: allPairs.token0, active: true }).select({ name: 1, symbol: 1, decimals: 1, _id: 0, id: 1 }).lean();
                let token1 = Token.findOne({ id: allPairs.token1, active: true }).select({ name: 1, symbol: 1, decimals: 1, _id: 0, id: 1 }).lean();
                promiseTokens.push(token0, token1);
            }

            promiseTokens = await Promise.all(promiseTokens);
            let token0 = promiseTokens[0];
            let token1 = promiseTokens[1];
            let temp = {

                id: allPairs.id,
                exchangeRate: allPairs.exchangeRate,
                exchangeRateDecimals: allPairs.exchangeRateDecimals,
                priceDiff: allPairs.priceDiff,
                marginEnabeled: allPairs.marginEnabled,
                minToken0Order: allPairs.minToken0Order,
                tokens: [token0, token1],

            };
            trandingPair.push(temp);
        }

        return res.status(200).send({ status: true, data: trandingPair });

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getPairTradingStatus", error);
        return res.status(500).send({ status: false, error: error.message });

    }
}
