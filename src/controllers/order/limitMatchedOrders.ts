

import { Pair, Order } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";
import { ifOrderCreated, ifPair } from "../../helper/interface";
import * as sentry from "@sentry/node";
import { getMultiBalance } from "../../muticall/getMultiBalance";















/**
 * @dev this api function will provide order as per the exchangeRate
 * @param {*} req.params.pairId (string) a valid pairId required
 * @param {*} req.query.exchangeRate (string) a valid pairId required
 * @param {*} req.query.buy (boolean) true for buying false for selling
 * @param {*} req.query.chainId (string) numeric chainId
 * @param {*} req.query.amount (string) numeric amount to be buy or sell in 10 to the pow 18 form
 * @param {*} res 
 * @returns 
 */

export enum ORDER_TYPE {
    BUY,
    SELL
}

// export async function getLimitMatchedOrders(req: any, res: any) {

//     try {

//         let pairId: string = req.params.pairId?.toLowerCase();

//         let exchangeRate: string = req.query.exchangeRate;

//         let orderType: number = Number(req.query.orderType);

//         let amount: number = Number(req.query.amount);

//         let chainId: string = req.query.chainId;


//         if (!pairId) {
//             return res.status(400).send({ status: false, error: errorMessage.pairId });
//         }

//         if (!exchangeRate || isNaN(Number(exchangeRate))) {
//             return res.status(400).send({ status: false, error: errorMessage.exchangerate });
//         }

//         if (isNaN(orderType) == true) {
//             return res.status(400).send({ status: false, error: errorMessage.orderType });
//         }

//         if (!amount || isNaN(amount) == true) {
//             return res.status(400).send({ status: false, error: errorMessage.amount });
//         }

//         const isPairIdExist: ifPair | null = await Pair.findOne({ id: pairId, chainId: chainId, active: true }).lean();

//         if (!isPairIdExist) {
//             return res.status(404).send({ status: false, error: errorMessage.pairId });
//         }

//         let getMatchedDoc: ifOrderCreated[] = [];

//         if (orderType == 0 || orderType == 2) {
//             getMatchedDoc = await Order.aggregate(
//                 [
//                     {
//                         $match: {
//                             $and: [
//                                 { pair: pairId },
//                                 { "$expr": { "$lte": [{ "$toDouble": "$exchangeRate" }, Number(exchangeRate)] } },
//                                 { orderType: { $in: [1, 3] } },
//                                 { chainId: chainId },
//                                 { deleted: false },
//                                 { active: true },
//                                 { cancelled: false }
//                             ]
//                         }
//                     },
//                     {
//                         $sort: { exchangeRate: 1, balanceAmount: 1 }
//                     }
//                 ],
//                 {
//                     collation: {
//                         locale: "en_US",
//                         numericOrdering: true
//                     }
//                 }
//             );
//         }
//         else if (orderType == 1 || orderType == 3) {
//             getMatchedDoc = await Order.aggregate(
//                 [
//                     {
//                         $match: {
//                             $and: [
//                                 { pair: pairId },
//                                 { "$expr": { "$gte": [{ "$toDouble": "$exchangeRate" }, Number(exchangeRate)] } },
//                                 { orderType: { $in: [0, 2] } },
//                                 { chainId: chainId },
//                                 { deleted: false },
//                                 { active: true },
//                                 { cancelled: false }
//                             ]
//                         }
//                     },
//                     {
//                         $sort: { exchangeRate: -1, balanceAmount: 1 }
//                     }
//                 ],
//                 {
//                     collation: {
//                         locale: "en_US",
//                         numericOrdering: true
//                     }
//                 }
//             );
//         }

//         let data: ifOrderCreated[] = [];
//         let currAmount = 0;
//         let counter = 0;
//         let addresses: any = [];
//         let amounts: any = [];
//         let ids: any = [];

//         if (getMatchedDoc.length == 0) {
//             return res.status(200).send({ status: true, data: [] });
//         }

//         for (let i = 0; i < getMatchedDoc.length; i++) {

//             if (currAmount >= amount) {
//                 counter++;
//                 if (counter > 10) {
//                     break;
//                 }
//             }

//             currAmount += Number(getMatchedDoc[i].balanceAmount);
//             addresses.push(getMatchedDoc[i].maker);
//             amounts.push(Number(getMatchedDoc[i].balanceAmount));
//             data.push(getMatchedDoc[i]);
//             ids.push(getMatchedDoc[i]._id);

//         }

//         let token;
//         if (orderType == 0 || orderType == 2) {
//             token = data[0].token0;
//         } else {
//             token = data[0].token1;
//         }

//         let response = await getMultiBalance(token, addresses, ids, data, chainId, amounts);

//         if (!response) {
//             return res.status(200).send({ status: true, data: [] });
//         }

//         return res.status(200).send({ status: true, data: response });
//     }
//     catch (error: any) {
//         console.log("Error @ getMatchedOrders", error);
//         sentry.captureException(error)
//         return res.status(500).send({ status: false, error: error.message });
//     }
// }
export async function getLimitMatchedOrders(req: any, res: any) {

    try {

        let pairId: string = req.params.pairId?.toLowerCase();

        let price: number = Number(req.query.price);

        let orderType: number = Number(req.query.orderType); // 0 for buy, 1 for sell

        let amount: number = Number(req.query.amount);

        let chainId: string = req.query.chainId;


        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!price || isNaN(Number(price))) {
            return res.status(400).send({ status: false, error: errorMessage.exchangerate });
        }

        if (isNaN(orderType) == true) {
            return res.status(400).send({ status: false, error: errorMessage.orderType });
        }

        if (!amount || isNaN(amount) == true) {
            return res.status(400).send({ status: false, error: errorMessage.amount });
        }

        const isPairIdExist: ifPair | null = await Pair.findOne({ id: pairId, chainId: chainId, active: true }).lean();

        if (!isPairIdExist) {
            return res.status(404).send({ status: false, error: errorMessage.pairId });
        }

        let getMatchedDoc: ifOrderCreated[] = [];

        if (orderType == ORDER_TYPE.BUY) {
            let sellOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token1,"$expr" : {"$lte" : [{"$toDouble" :"$pairPrice"} , price]}, chainId: chainId, action: { $in: [0, 2] }, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
            let sellOrder1: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token0,"$expr" : {"$lte" : [{"$toDouble" :"$pairPrice"} , price]}, chainId: chainId, action: 1, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();

            let promise = await Promise.all([sellOrder, sellOrder1]);

            sellOrder = promise[0];
            sellOrder1 = promise[1];
            getMatchedDoc = [...sellOrder, ...sellOrder1].sort((a, b) => a.pairPrice - b.pairPrice);
        }
        // {"$expr" : {"$gt" : [{"$toInt" :"$diskSizeGb"}
        // {"$expr" : {"$gt" : [{"$toInt" :"$diskSizeGb"} , 200]}}
        else if (orderType == ORDER_TYPE.SELL) {
            // let buyOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token0, pairPrice: { $gte: Number(price) }, chainId: chainId, action: { $in: [0, 2] }, deleted: false, active: true, cancelled: false }).sort({ pairPrice: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
            let buyOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token0,"$expr" : {"$gte" : [{"$toDouble" :"$pairPrice"} , price]}, chainId: chainId, action: { $in: [0, 2] }, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
            // let buyOrder1: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token1, pairPrice: { $gte: Number(price) }, chainId: chainId, action: 1, deleted: false, active: true, cancelled: false }).sort({ pairPrice: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
            let buyOrder1: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token1, "$expr" : {"$gte" : [{"$toDouble" :"$pairPrice"} , price]}, chainId: chainId, action: 1, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
            let promise = await Promise.all([buyOrder, buyOrder1]);
            buyOrder = promise[0];
            buyOrder1 = promise[1];
            getMatchedDoc = [...buyOrder, ...buyOrder1].sort((a, b) => b.pairPrice - a.pairPrice);
        }

        let data: ifOrderCreated[] = [];
        let currAmount = 0;
        let counter = 0;
        let addresses: any = [];
        let amounts: any = [];
        let ids: any = [];

        if (getMatchedDoc.length == 0) {
            return res.status(200).send({ status: true, data: [] });
        }

        for (let i = 0; i < getMatchedDoc.length; i++) {

            if (currAmount >= amount) {
                counter++;
                if (counter > 10) {
                    break;
                }
            }

            currAmount += Number(getMatchedDoc[i].balanceAmount);
            addresses.push(getMatchedDoc[i].maker);
            amounts.push(Number(getMatchedDoc[i].balanceAmount));
            data.push(getMatchedDoc[i]);
            ids.push(getMatchedDoc[i]._id);

        }

        let token;
        if (orderType == ORDER_TYPE.BUY) {
            token = isPairIdExist.token0;
        } else {
            token = isPairIdExist.token1;
        }

        let response = await getMultiBalance(token, addresses, data, chainId, isPairIdExist.token0);

        if (!response) {
            return res.status(200).send({ status: true, data: [] });
        }

        return res.status(200).send({ status: true, data: response });
    }
    catch (error: any) {
        console.log("Error @ getMatchedOrders", error);
        sentry.captureException(error)
        return res.status(500).send({ status: false, error: error.message });
    }
}
