import { OrderCreated, PairCreated, Token } from "../../db";
import { handleOrderCancelled } from "../../handlers/orderCancelled";
import { blackListTokenSignatureValidation } from "../../utils/blackListTokenSignatureVerify";









export async function handleBlackListToken(req: any, res: any) {

    try {

        const signature = req.body.signature;
        const blackList = req.body.blackList;
        const token = req.body.token;
        const chainId = req.body.chainId;

        const value = {
            token: token,
            blackList: blackList
        };

        if (blackList != 0 && blackList != 1) {
            return res.status(400).send({ status: true, message: "blacklist only can be 0 or 1" })
        }

        const validateSignature = blackListTokenSignatureValidation(signature, value, chainId);

        if (validateSignature == false) {
            return res.status(403).send({ status: true, message: "Signature not verified" })
        };

        const getToken = await Token.findOne({ id: token, chainId: chainId }).lean();

        if (!getToken) {
            return res.status(400).send({ status: true, message: "Token not found" })
        }

        if (blackList == 1) {

            if (getToken?.active == true) {
                return res.status(200).send({ status: true, message: "Token already active" })
            };

            await Token.findOneAndUpdate({ id: token, chainId: chainId }, { $set: { active: true } });

            // find token in pair token0;
            let getPair0 = await PairCreated.find({ token0: token, chainId: chainId });

            for (let i in getPair0) {

                await PairCreated.findOneAndUpdate({ _id: getPair0[i]._id }, { $set: { active: true } });

            }
            // find token in pair token1;
            let getPair1 = await PairCreated.find({ token1: token, chainId: chainId });

            for (let i in getPair1) {

                await PairCreated.findOneAndUpdate({ _id: getPair1[i]._id }, { $set: { active: true } });

            }
            return res.status(200).send({ status: true, message: "Token Activate" })

        }


        if (getToken?.active == false) {
            return res.status(200).send({ status: true, message: "Token already deactive" })
        };
        // find token in pair token0;
        let getPair0 = await PairCreated.find({ token0: token });

        for (let i in getPair0) {

            await PairCreated.findOneAndUpdate({ _id: getPair0[i]._id }, { $set: { active: false } });
            // cancel Orders;
            let getOrders = await OrderCreated.find({ pair: getPair0[i].id, active: true }).lean();

            for (let j in getOrders) {
                await handleOrderCancelled([getOrders[j].id])
            }

        }
        // find token in pair token1;
        let getPair1 = await PairCreated.find({ token1: token });

        for (let i in getPair1) {

            await PairCreated.findOneAndUpdate({ _id: getPair1[i]._id }, { active: false });
            // cancel Orders;
            let getOrders = await OrderCreated.find({ pair: getPair1[i].id, active: true }).lean();

            for (let j in getOrders) {
                await handleOrderCancelled([getOrders[j].id])
            }

        }
        await Token.findOneAndUpdate({ id: token, chainId: chainId }, { $set: { active: false } });
        return res.status(200).send({ status: true, message: "Token Deactivate" })

    }
    catch (error) {
        console.log("Error @ handleBlackListToken", error)
    }
}