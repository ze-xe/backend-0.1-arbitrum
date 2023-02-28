import { Order, Pair } from "../../DB/db";
import Big from "big.js";
import { errorMessage } from "../../helper/errorMessage";
import { ifOrderCreated, ifPair } from "../../helper/interface";
import { } from "./helper/marginValidationUserPosition";
import * as sentry from "@sentry/node";
import { getMultiBalance } from "../../muticall/getMultiBalance";
import { ORDER_TYPE } from "./limitMatchedOrders";










// export async function getMatchedMarketOrders(req: any, res: any) {
//     try {

//         let pairId: string = req.params.pairId?.toLowerCase();
//         let orderType: number = Number(req.query.orderType);
//         let amount: number = Number(req.query.amount);
//         let chainId: string = req.query.chainId;

//         if (!chainId) {
//             return res.status(400).send({ status: false, error: errorMessage.chainId });
//         }

//         if (!pairId) {
//             return res.status(400).send({ status: false, error: errorMessage.pairId });
//         }

//         if (isNaN(orderType) == true) {
//             return res.status(400).send({ status: false, error: errorMessage.orderType });
//         }

//         if (isNaN(amount) == true || amount <= 0) {
//             return res.status(400).send({ status: false, error: errorMessage.amount });
//         }

//         const isPairIdExist: ifPair | null = await Pair.findOne({ id: pairId, chainId: chainId, active: true }).lean();

//         if (!isPairIdExist) {
//             return res.status(404).send({ status: false, error: errorMessage.pairId });
//         }

//         let getMatchedDoc: ifOrderCreated[] = [];

//         if (orderType == 0 || orderType == 2) {
//             getMatchedDoc = await Order.find({ pair: pairId, orderType: { $in: [1, 3] }, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
//         }
//         else if (orderType == 1 || orderType == 3) {
//             getMatchedDoc = await Order.find({ pair: pairId, orderType: { $in: [0, 2] }, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
//         }

//         let data: ifOrderCreated[] = [];
//         let currAmount: number = 0;
//         let counter: number = 0;
//         let addresses: string[] = [];
//         let amounts: number[] = [];
//         let ids: string[] = [];

//         for (let i = 0; i < getMatchedDoc?.length; i++) {

//             if (currAmount >= amount) {
//                 counter++;
//                 if (counter > 5) {
//                     break;
//                 }
//             }
//             if (orderType == 0 || orderType == 2) {
//                 currAmount += Number(Big(getMatchedDoc[i].balanceAmount).times(getMatchedDoc[i].price).div(Big(10).pow(18)));
//             }
//             else if (orderType == 1 || orderType == 3) {
//                 currAmount += Number(getMatchedDoc[i].balanceAmount)
//             }
//             addresses.push(getMatchedDoc[i].maker);
//             amounts.push(Number(getMatchedDoc[i].balanceAmount));
//             data.push(getMatchedDoc[i]);
//             ids.push(getMatchedDoc[i]._id);

//         }

//         if (getMatchedDoc.length == 0) {
//             return res.status(200).send({ status: true, data: [] });
//         }

//         let token;
//         if (orderType == 0 || orderType == 2) {
//             token = data[0].token0;
//         } else {
//             token = data[0].token1;
//         }

//         let result = await getMultiBalance(token, addresses, data, chainId, token); // need to add pair id instead of token

//         if (!result) {
//             return res.status(200).send({ status: true, data: [] });
//         }
//         return res.status(200).send({ status: true, data: result });
//     }
//     catch (error: any) {
//         console.log("Error @ getMatchedMarketOrders", error);
//         sentry.captureException(error)
//         return res.status(500).send({ status: false, error: error.message });
//     }
// }

export async function getMatchedMarketOrders(req: any, res: any) {
    try {

        let pairId: string = req.params.pairId?.toLowerCase();

        let orderType: number = Number(req.query.orderType); // 0 for buy, 1 for sell

        let amount: number = Number(req.query.amount);

        let chainId: string = req.query.chainId;


        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
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
            let sellOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token1, chainId: chainId, action: { $in: [0, 2] }, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
            let sellOrder1: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token0, chainId: chainId, action: 1, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();

            let promise = await Promise.all([sellOrder, sellOrder1]);

            sellOrder = promise[0];
            sellOrder1 = promise[1];
            getMatchedDoc = [...sellOrder, ...sellOrder1].sort((a, b) => a.pairPrice - b.pairPrice);
        }
        else if (orderType == ORDER_TYPE.SELL) {
            let buyOrder: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token0, chainId: chainId, action: { $in: [0, 2] }, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
            let buyOrder1: any | ifOrderCreated[] = Order.find({ pair: pairId, token0: isPairIdExist.token1, chainId: chainId, action: 1, deleted: false, active: true, cancelled: false, expired: false }).sort({ pairPrice: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
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
        console.log("Error @ getMatchedMarketOrders", error);
        sentry.captureException(error)
        return res.status(500).send({ status: false, error: error.message });
    }
}


