import { OrderCreated } from "../../db";
import Big from "big.js";
import { errorMessage } from "../../helper/errorMessage";
import { ifOrderCreated} from "../../helper/interface";
import {  } from "./helper/marginValidationUserPosition";
import { sentry } from "../../../app";
import { getMultiBalance } from "../../muticall/getMultiBalance";










export async function getMatchedMarketOrders(req: any, res: any) {
    try {

        let pairId: string = req.params.pairId?.toLowerCase();
        let orderType: number = Number(req.query.orderType);
        let amount: number = Number(req.query.amount);
        let chainId: string = req.query.chainId;

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.chainId });
        }

        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (isNaN(orderType) == true) {
            return res.status(400).send({ status: false, error: errorMessage.orderType });
        }

        if (isNaN(amount) == true || amount <= 0) {
            return res.status(400).send({ status: false, error: errorMessage.amount });
        }

        let getMatchedDoc: ifOrderCreated[] = [];

        if (orderType == 0 || orderType == 2) {
            getMatchedDoc = await OrderCreated.find({ pair: pairId, orderType: { $in: [1, 3] }, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
        }
        else if (orderType == 1 || orderType == 3) {
            getMatchedDoc = await OrderCreated.find({ pair: pairId, orderType: { $in: [0, 2] }, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1 }).collation({ locale: "en_US", numericOrdering: true }).lean();
        }

        let data: ifOrderCreated[] = [];
        let currAmount: number = 0;
        let counter: number = 0;
        let addresses: string[] = [];
        let amounts: number[] = [];
        let ids: string[] = [];

        for (let i = 0; i < getMatchedDoc?.length; i++) {

            if (currAmount >= amount) {
                counter++;
                if (counter > 5) {
                    break;
                }
            }
            if (orderType == 0 || orderType == 2) {
                currAmount += Number(Big(getMatchedDoc[i].balanceAmount).times(getMatchedDoc[i].exchangeRate).div(Big(10).pow(18)));
            }
            else if (orderType == 1 || orderType == 3) {
                currAmount += Number(getMatchedDoc[i].balanceAmount)
            }
            addresses.push(getMatchedDoc[i].maker);
            amounts.push(Number(getMatchedDoc[i].balanceAmount));
            data.push(getMatchedDoc[i]);
            ids.push(getMatchedDoc[i]._id);

        }

        if (getMatchedDoc.length == 0) {
            return res.status(200).send({ status: true, data: [] });
        }

        let token;
        if (orderType == 0 || orderType == 2) {
            token = data[0].token0;
        } else {
            token = data[0].token1;
        }

        let result = await getMultiBalance(token, addresses, ids, data, chainId, amounts);

        if (!result) {
            return res.status(200).send({ status: true, data: [] });
        }
        return res.status(200).send({ status: true, data: result });
    }
    catch (error: any) {
        console.log("Error @ getMatchedMarketOrders", error);
        sentry.captureException(error)
        return res.status(500).send({ status: false, error: error.message });
    }
}


