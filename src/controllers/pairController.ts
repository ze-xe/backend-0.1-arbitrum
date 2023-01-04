import { ifOrderCreated, ifPairCreated } from "../helper/interface";

import { PairCreated, Token, OrderCreated, OrderExecuted } from "../db";
import { Decimals } from "../helper/constant";
import { errorMessage } from "../helper/errorMessage"
import { sentry } from "../../app";



export async function fetchOrders(req: any, res: any) {
    try {

        let pairId: string = req.params.pairId?.toLowerCase();
        let chainId: string = req.query.chainId;

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }

        const isPairIdExist: ifPairCreated | null = await PairCreated.findOne({ id: pairId }).lean();

        if (!isPairIdExist) {
            return res.status(404).send({ status: false, error: errorMessage.pairId });
        }

        let buyOrder: any | ifOrderCreated[] = OrderCreated.find({ pair: pairId, chainId: chainId, orderType: { $in: [0, 2] }, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
        let sellOrder: any | ifOrderCreated[] = OrderCreated.find({ pair: pairId, chainId: chainId, orderType: { $in: [1, 3] }, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();

        let promise = await Promise.all([buyOrder, sellOrder]);
        buyOrder = promise[0];
        sellOrder = promise[1];

        let mapBuy: any = {};
        let mapSell: any = {};
        for (let i = 0; i < buyOrder.length; i++) {

            if (!mapBuy[`${buyOrder[i].exchangeRate}`]) {

                mapBuy[`${buyOrder[i].exchangeRate}`] = buyOrder[i].balanceAmount;
            }
            else if (mapBuy[`${buyOrder[i].exchangeRate}`]) {

                mapBuy[`${buyOrder[i].exchangeRate}`] = Number(mapBuy[`${buyOrder[i].exchangeRate}`]) + Number(buyOrder[i].balanceAmount);
            }

        }

        for (let i in sellOrder) {

            if (!mapSell[`${sellOrder[i].exchangeRate}`]) {

                mapSell[`${sellOrder[i].exchangeRate}`] = sellOrder[i].balanceAmount;

            }
            else if (mapSell[`${sellOrder[i].exchangeRate}`]) {

                mapSell[`${sellOrder[i].exchangeRate}`] = Number(mapSell[`${sellOrder[i].exchangeRate}`]) + Number(sellOrder[i].balanceAmount);
            }
        }

        let buyOrders = [];

        let buyEntries: [string, string][] = Object.entries(mapBuy);

        for (let i in buyEntries) {
            let temp = {

                exchangeRate: buyEntries[i][0],
                amount: (buyEntries[i][1]).toString()

            };
            buyOrders.push(temp);
        }

        let sellOrders = [];

        let sellEntries = Object.entries(mapSell);

        for (let i in sellEntries) {

            let temp = {
                exchangeRate: sellEntries[i][0],
                amount: sellEntries[i][1],
            };
            sellOrders.push(temp);
        }

        let data = {
            pair: pairId,
            decimals: Decimals.token,
            sellOrders: sellOrders,
            buyOrders: buyOrders
        };

        return res.status(200).send({ status: true, data: data });
    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ fetchOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}


export async function getAllPairDetails(req: any, res: any) {

    try {

        let chainId: string = req.query.chainId;

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }
        let allPairs: ifPairCreated[] = await PairCreated.find({ chainId: chainId }).lean();

        let data = [];

        let promiseTokens: any = [];

        for (let i in allPairs) {

            let token0 = Token.findOne({ id: allPairs[i].token0 }).select({ name: 1, symbol: 1, decimals: 1, _id: 0, id: 1 }).lean();
            let token1 = Token.findOne({ id: allPairs[i].token1 }).select({ name: 1, symbol: 1, decimals: 1, _id: 0, id: 1 }).lean();
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

        let getPairOrderHistory = await OrderExecuted.find({ pair: pairId, chainId }).sort({ blockTimestamp: -1, logIndex: -1 }).select({ fillAmount: 1, exchangeRate: 1, orderType: 1, _id: 0 }).limit(50).lean();

        return res.status(200).send({ status: true, data: getPairOrderHistory });

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getPairOrderExecutedHistory", error);
        return res.status(500).send({ status: false, error: error.message }); 
    }
}



export async function getPairTradingStatus(req: any, res: any) {

    try {

        let pairId: string = req.params.pairId.toLowerCase();

        let _24hr = 24 * 60 * 60 * 1000;
        let _7D = 7 * _24hr;
        let _30D = 30 * _24hr;
        let _90D = 3 * _30D;
        let _1Yr = 365 * _24hr;

        let interval = [_24hr, _7D, _30D, _90D, _1Yr];

        let data = [];

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


