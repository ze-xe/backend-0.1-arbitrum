
import { sentry } from "../../../app";
import { OrderCreated, PairCreated } from "../../db";







export async function fetchDBRecords(req: any, res: any) {

    try {

        const orders = await PairCreated.findOne();

        if (!orders) {
            return res.status(200).send({ status: true, data: null });
        }
        else {
            return res.status(200).send({ status: true, data: orders });
        }

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ fetchDBRecords", error);
        return res.status(500).send({ status: false, error: error.message });
    }

}