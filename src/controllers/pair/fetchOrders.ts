

import { ifOrderCreated, ifPair } from "../../helper/interface";
import { Pair, Order } from "../../DB/db";
import { Decimals } from "../../helper/constant";
import { errorMessage } from "../../helper/errorMessage"
import * as sentry from "@sentry/node";
import { ethers } from "ethers";
import { parseEther } from "../../utils/utils";





// id: { type: String, required: true, trim: true },
// token0: { type: String, required: true, trim: true },
// token1: { type: String, required: true, trim: true },
// priceDecimals: { type: String, required: true },
// minToken0Order: { type: String, required: true },
// price: { type: String, required: true },
// priceDiff: String,
// chainId: String,
// symbol: String,
// marginEnabled: { type: Boolean, default: false },
// active: { type: Boolean, default: true }



// export async function fetchOrders(req: any, res: any) {
//     try {

//         let pairId: string = req.params.pairId?.toLowerCase();
//         let chainId: string = req.query.chainId;

//         if (!pairId) {
//             return res.status(400).send({ status: false, error: errorMessage.pairId });
//         }

//         if (!chainId) {
//             return res.status(400).send({ status: false, error: errorMessage.chainId });
//         }

//         const isPairIdExist: ifPair | null = await Pair.findOne({ id: pairId, active: true }).lean();

//         if (!isPairIdExist) {
//             return res.status(404).send({ status: false, error: errorMessage.pairId });
//         }

//         let buyOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, chainId: chainId, orderType: { $in: [0, 2] }, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
//         let sellOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, chainId: chainId, orderType: { $in: [1, 3] }, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();

//         let promise = await Promise.all([buyOrder, sellOrder]);
//         buyOrder = promise[0];
//         sellOrder = promise[1];

//         let mapBuy: any = {};
//         let mapSell: any = {};
//         for (let i = 0; i < buyOrder.length; i++) {

//             if (!mapBuy[`${buyOrder[i].exchangeRate}`]) {

//                 mapBuy[`${buyOrder[i].exchangeRate}`] = buyOrder[i].balanceAmount;
//             }
//             else if (mapBuy[`${buyOrder[i].exchangeRate}`]) {

//                 mapBuy[`${buyOrder[i].exchangeRate}`] = Number(mapBuy[`${buyOrder[i].exchangeRate}`]) + Number(buyOrder[i].balanceAmount);
//             }

//         }

//         for (let i in sellOrder) {

//             if (!mapSell[`${sellOrder[i].exchangeRate}`]) {

//                 mapSell[`${sellOrder[i].exchangeRate}`] = sellOrder[i].balanceAmount;

//             }
//             else if (mapSell[`${sellOrder[i].exchangeRate}`]) {

//                 mapSell[`${sellOrder[i].exchangeRate}`] = Number(mapSell[`${sellOrder[i].exchangeRate}`]) + Number(sellOrder[i].balanceAmount);
//             }
//         }

//         let buyOrders: any = [];

//         let buyEntries: [string, string][] = Object.entries(mapBuy);

//         for (let i in buyEntries) {
//             let temp = {

//                 exchangeRate: buyEntries[i][0],
//                 amount: (buyEntries[i][1]).toString()

//             };
//             buyOrders.push(temp);
//         }

//         let sellOrders: any = [];

//         let sellEntries = Object.entries(mapSell);

//         for (let i in sellEntries) {

//             let temp = {
//                 exchangeRate: sellEntries[i][0],
//                 amount: sellEntries[i][1],
//             };
//             sellOrders.push(temp);
//         }

//         let data = {
//             pair: pairId,
//             decimals: Decimals.token,
//             sellOrders: sellOrders,
//             buyOrders: buyOrders
//         };

//         return res.status(200).send({ status: true, data: data });
//     }
//     catch (error: any) {
//         sentry.captureException(error)
//         console.log("Error @ fetchOrders", error);
//         return res.status(500).send({ status: false, error: error.message });
//     }
// }

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

        let buyOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token0, chainId: chainId, action: { $in: [0, 2] }, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
        let sellOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token1, chainId: chainId, action: { $in: [0, 2] }, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
        let buyOrder1: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token1, chainId: chainId, action: 1, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
        let sellOrder1: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token0, chainId: chainId, action: 1, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();

        let promise = await Promise.all([buyOrder, sellOrder, buyOrder1, sellOrder1]);
        buyOrder = promise[0];
        sellOrder = promise[1];
        buyOrder1 = promise[2];
        sellOrder1 = promise[3];

        let mapBuy: any = {};
        let mapSell: any = {};
        // action limit and open
        for (let i = 0; i < buyOrder.length; i++) {

            buyOrder[i].pairPrice = parseEther(buyOrder[i].pairPrice);

            if (!mapBuy[`${buyOrder[i].pairPrice}`]) {

                mapBuy[`${buyOrder[i].pairPrice}`] = buyOrder[i].balanceAmount;
            }
            else if (mapBuy[`${buyOrder[i].pairPrice}`]) {

                mapBuy[`${buyOrder[i].pairPrice}`] = Number(mapBuy[`${buyOrder[i].pairPrice}`]) + Number(buyOrder[i].balanceAmount);
            }

        }

        for (let i in sellOrder) {

            sellOrder[i].pairPrice = parseEther(sellOrder[i].pairPrice);

            if (!mapSell[`${sellOrder[i].pairPrice}`]) {

                mapSell[`${sellOrder[i].pairPrice}`] = sellOrder[i].balanceAmount;

            }
            else if (mapSell[`${sellOrder[i].pairPrice}`]) {

                mapSell[`${sellOrder[i].pairPrice}`] = Number(mapSell[`${sellOrder[i].pairPrice}`]) + Number(sellOrder[i].balanceAmount);
            }
        }
        // action close
        for (let i = 0; i < buyOrder1.length; i++) {

            buyOrder1[i].pairPrice = parseEther(buyOrder1[i].pairPrice);

            if (!mapBuy[`${buyOrder1[i].pairPrice}`]) {

                mapBuy[`${buyOrder1[i].pairPrice}`] = buyOrder1[i].balanceAmount;
            }
            else if (mapBuy[`${buyOrder1[i].pairPrice}`]) {

                mapBuy[`${buyOrder1[i].pairPrice}`] = Number(mapBuy[`${buyOrder1[i].pairPrice}`]) + Number(buyOrder1[i].balanceAmount);
            }

        }

        for (let i in sellOrder1) {

            sellOrder1[i].pairPrice = parseEther(sellOrder1[i].pairPrice);

            if (!mapSell[`${sellOrder1[i].pairPrice}`]) {

                mapSell[`${sellOrder1[i].pairPrice}`] = sellOrder1[i].balanceAmount;

            }
            else if (mapSell[`${sellOrder1[i].pairPrice}`]) {

                mapSell[`${sellOrder1[i].pairPrice}`] = Number(mapSell[`${sellOrder1[i].pairPrice}`]) + Number(sellOrder1[i].balanceAmount);
            }
        }


        let buyOrders: any = [];

        let buyEntries: [string, string][] = Object.entries(mapBuy);

        buyEntries = buyEntries.sort((a, b) => Number(b[0]) - Number(a[0]));

        for (let i in buyEntries) {
            let temp = {

                price: buyEntries[i][0],
                token0Amount: parseEther(buyEntries[i][1]),

            };
            buyOrders.push(temp);
        }

        let sellOrders: any = [];

        let sellEntries: [string, string][] = Object.entries(mapSell);
        sellEntries = sellEntries.sort((a, b) => Number(a[0]) - Number(b[0]));
        for (let i in sellEntries) {

            let temp = {
                price: sellEntries[i][0],
                token0Amount: parseEther(sellEntries[i][1]),
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