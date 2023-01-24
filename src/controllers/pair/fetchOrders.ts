

import { ifOrderCreated, ifPair } from "../../helper/interface";
import { Pair, Order } from "../../DB/db";
import { Decimals } from "../../helper/constant";
import { errorMessage } from "../../helper/errorMessage"
import * as sentry from "@sentry/node";









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

        const isPairIdExist: ifPair | null = await Pair.findOne({ id: pairId, active: true }).lean();

        if (!isPairIdExist) {
            return res.status(404).send({ status: false, error: errorMessage.pairId });
        }

        let buyOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, chainId: chainId, orderType: { $in: [0, 2] }, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
        let sellOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, chainId: chainId, orderType: { $in: [1, 3] }, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();

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

        let buyOrders: any = [];

        let buyEntries: [string, string][] = Object.entries(mapBuy);

        for (let i in buyEntries) {
            let temp = {

                exchangeRate: buyEntries[i][0],
                amount: (buyEntries[i][1]).toString()

            };
            buyOrders.push(temp);
        }

        let sellOrders: any = [];

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