import mongoose from "mongoose";
import * as sentry from "@sentry/node";





export async function DBStatus(req: any, res: any) {

    try {
        // mongoose.connection.close()
        const serverStatus = () => {
            return {
                dbState: mongoose.STATES[mongoose.connection.readyState]
            }
        };

        let result = serverStatus()

        if (result.dbState == "connected" || result.dbState == "connecting") {
            return res.status(200).send({ status: true, data: result });
        }
        else {
            return res.status(500).send({ status: false, data: result });
        }

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ DBStatus", error);
        return res.status(500).send({ status: false, error: error.message });
    }

}