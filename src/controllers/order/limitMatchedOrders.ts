

import { PairCreated, OrderCreated } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";
import { ifOrderCreated, ifPairCreated } from "../../helper/interface";
import { sentry } from "../../../app";
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

export async function getLimitMatchedOrders(req: any, res: any) {

    try {

        let pairId: string = req.params.pairId?.toLowerCase();

        let exchangeRate: string = req.query.exchangeRate;

        let orderType: number = Number(req.query.orderType);

        let amount: number = Number(req.query.amount);

        let chainId: string = req.query.chainId;


        if (!pairId) {
            return res.status(400).send({ status: false, error: errorMessage.pairId });
        }

        if (!exchangeRate || isNaN(Number(exchangeRate))) {
            return res.status(400).send({ status: false, error: errorMessage.exchangerate });
        }

        if (isNaN(orderType) == true) {
            return res.status(400).send({ status: false, error: errorMessage.orderType });
        }

        if (!amount || isNaN(amount) == true) {
            return res.status(400).send({ status: false, error: errorMessage.amount });
        }

        const isPairIdExist: ifPairCreated | null = await PairCreated.findOne({ id: pairId, chainId: chainId, active: true }).lean();

        if (!isPairIdExist) {
            return res.status(404).send({ status: false, error: errorMessage.pairId });
        }

        let getMatchedDoc: ifOrderCreated[] = [];

        if (orderType == 0 || orderType == 2) {
            getMatchedDoc = await OrderCreated.aggregate(
                [
                    {
                        $match: {
                            $and: [
                                { pair: pairId },
                                { "$expr": { "$lte": [{ "$toDouble": "$exchangeRate" }, Number(exchangeRate)] } },
                                { orderType: { $in: [1, 3] } },
                                { chainId: chainId },
                                { deleted: false },
                                { active: true },
                                { cancelled: false }
                            ]
                        }
                    },
                    {
                        $sort: { exchangeRate: 1, balanceAmount: 1 }
                    }
                ],
                {
                    collation: {
                        locale: "en_US",
                        numericOrdering: true
                    }
                }
            );
        }
        else if (orderType == 1 || orderType == 3) {
            getMatchedDoc = await OrderCreated.aggregate(
                [
                    {
                        $match: {
                            $and: [
                                { pair: pairId },
                                { "$expr": { "$gte": [{ "$toDouble": "$exchangeRate" }, Number(exchangeRate)] } },
                                { orderType: { $in: [0, 2] } },
                                { chainId: chainId },
                                { deleted: false },
                                { active: true },
                                { cancelled: false }
                            ]
                        }
                    },
                    {
                        $sort: { exchangeRate: -1, balanceAmount: 1 }
                    }
                ],
                {
                    collation: {
                        locale: "en_US",
                        numericOrdering: true
                    }
                }
            );
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
        if (orderType == 0 || orderType == 2) {
            token = data[0].token0;
        } else {
            token = data[0].token1;
        }

        let response = await getMultiBalance(token, addresses, ids, data, chainId, amounts);

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
