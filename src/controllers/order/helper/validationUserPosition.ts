import Big from "big.js";
import { User } from "../../../DB/db";
import { errorMessage } from "../../../helper/errorMessage";
import { multicall } from "../../../muticall/muticall";
import * as sentry from "@sentry/node";

/**
           LIMIT: SELL 0.1 BTC for USDC (0.0001)
           token0: USDC
           token1: BTC
           amount: 1000 USDC
        */
/**
    LIMIT: BUY 0.1 BTC for USDC (10000)
    token0: BTC
    token1: USDC
    amount: 0.1 BTC
 */



export async function validationAndUserPosition(data: any, chainId: string, ipfs: boolean | undefined) {
    try {

        let multicallData: number[] | null;
        let userTokenBalance = 0;
        let allowance = 0;
        
        let findUserPosition = await User.findOne({ id: data.maker, token: data.token1, chainId: chainId }).lean();
        if (!ipfs) {
            multicallData = await multicall(data.token1, data.maker, chainId)
            if (multicallData) {
                userTokenBalance = multicallData[0];
                allowance = multicallData[1];
            }
        }
       
        if (findUserPosition) {

            let _id = findUserPosition._id.toString();

            let currentInOrderBalance = Big(findUserPosition.inOrderBalance).plus(data.token1Amount).toString();

            if (!ipfs && Number(allowance) < Number(currentInOrderBalance)) {
                console.log(`${errorMessage.INSUFFICIENT_ALLOWANCE, data.token1}`);
                return { status: false, error: errorMessage.INSUFFICIENT_ALLOWANCE, statusCode: 400 };
            }

            if (!ipfs && Number(userTokenBalance) < Number(currentInOrderBalance)) {
                console.log(`${errorMessage.INSUFFICIENT_BALANCE, data.token1}`);
                return { status: false, error: errorMessage.INSUFFICIENT_BALANCE, statusCode: 400 };
            }

            await User.findOneAndUpdate(
                { _id: _id },
                { $set: { inOrderBalance: currentInOrderBalance } }
            );
        } else {

            if (!ipfs && Number(allowance) < Number(data.token1Amount)) {
                console.log(`${errorMessage.INSUFFICIENT_ALLOWANCE, data.token1}`);
                return { status: false, error: errorMessage.INSUFFICIENT_ALLOWANCE, statusCode: 400 };
            }

            if (!ipfs && Number(userTokenBalance) < Number(data.token1Amount)) {
                console.log(`${errorMessage.INSUFFICIENT_BALANCE, data.token1}`);
                return { status: false, error: errorMessage.INSUFFICIENT_BALANCE, statusCode: 400 };
            }

            User.create(
                {
                    token: data.token1,
                    chainId: chainId,
                    inOrderBalance: data.token1Amount,
                    id: data.maker
                }
            );

        }
        return { status: true }
    }
    catch (error) {
        sentry.captureException(error)
        console.log(`error @ validationAndUserPosition`)
        return { status: false, error: errorMessage.SERVER_ERROR, statusCode: 500 }
    }
}