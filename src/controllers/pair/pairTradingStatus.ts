import { OrderExecuted } from "../../db";
import { sentry } from "../../../app";











export async function getPairTradingStatus(req: any, res: any) {

    try {

        let pairId: string = req.params.pairId.toLowerCase();

        let _24hr = 24 * 60 * 60 * 1000;
        let _7D = 7 * _24hr;
        let _30D = 30 * _24hr;
        let _90D = 3 * _30D;
        let _1Yr = 365 * _24hr;

        let interval = [_24hr, _7D, _30D, _90D, _1Yr];

        let data: any = [];

        for (let i in interval) {

            let getOrderExecuted = await OrderExecuted.aggregate(
                [
                    {
                        $match: {
                            $and: [
                                { pair: pairId },
                                { blockTimestamp: { $gte: Date.now() - interval[i] } }
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
            let intervalStr = ["_24hr", " _7D", " _30D", "_90D", " _1Yr"];

            if (getOrderExecuted[0].exchangeRate.length <= 0) {

                let temp = {
                    interval: `${intervalStr[i]}`,
                    changeInER: 0,
                    volume: 0
                };

                data.push(temp);

            }
            else {
                let changeInER = getOrderExecuted[0].exchangeRate[0].first - getOrderExecuted[0].exchangeRate[0].last;

                changeInER = (changeInER / getOrderExecuted[0].exchangeRate[0].last) * 100;

                let volume = Number(getOrderExecuted[0].volume[0].volume) / 10 ** 18;

                let temp = {
                    interval: `${intervalStr[i]}`,
                    changeInER: changeInER,
                    volume: volume
                };

                data.push(temp);
            }

        }

        return res.status(200).send({ status: true, data: data });

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getPairTradingStatus", error);
        return res.status(500).send({ status: false, error: error.message });

    }
}


