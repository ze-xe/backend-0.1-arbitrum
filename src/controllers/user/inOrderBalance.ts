import * as sentry from "@sentry/node";
import { User } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";
import { parseEther } from "../../utils/utils";



export async function getUserInOrderBalance(req: any, res: any) {
    try {

        let token: string = req.params.token?.toLowerCase();
        let chainId: string = req.query.chainId;
        let maker: string = req.params.maker?.toLowerCase();

        if (!token) {
            return res.status(400).send({ status: false, error: errorMessage.TOKEN_REQUIRED });
        }

        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.CHAIN_ID_REQUIRED });
        }

        if (!maker) {
            return res.status(400).send({ status: false, error: errorMessage.MAKER_REQUIRED });
        }

        let userInOrder: any[] = await User.find({ token: token, id: maker, chainId: chainId }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0, balance: 0 }).lean();
        if (userInOrder.length > 0) {

            userInOrder[0].inOrderBalance = userInOrder[0].inOrderBalance;
        }
        let data = userInOrder.map(x => {
            return {
                id: x.id,
                token: x.token,
                inOrderBalance: parseEther(x.inOrderBalance),
                chainId: x.chainId
            }
        })
        return res.status(200).send({ status: true, data: data });

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ getMatchedMarketOrders", error);
        return res.status(500).send({ status: false, error: error.message });
    }
}
