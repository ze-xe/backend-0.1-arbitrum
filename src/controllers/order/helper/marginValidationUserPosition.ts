import Big from "big.js";
import { ethers } from "ethers";
import * as sentry from "@sentry/node";
import { Token, User } from "../../../DB/db";
import { getLeverAddress } from "../../../helper/chain";
import { errorMessage } from "../../../helper/errorMessage";
import { ifUserPosition } from "../../../helper/interface";
import { multicallFor2Tokens } from "../../../muticall/twoTokenMulticall";
import { multicall } from "../../../muticall/muticall";

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
export enum Action {
    OPEN,
    CLOSE,
    LIMIT
}
export async function marginValidationAndUserPosition(signature: string, data: any, chainId: string, ipfs: boolean | undefined) {
    try {
        // maker will supply token0 and long token0

        let multicallData: number[] | null;
        let userToken0Balance = 0;
        let allowanceToken0 = 0;

        if (!ipfs) {
            multicallData =await multicall(data.token0, data.maker, chainId)
            if (multicallData) {
                userToken0Balance = multicallData[0];
                allowanceToken0 = multicallData[1];
            }
        }

        if (data.action == Action.OPEN) {
            const findUserPosition0: ifUserPosition | null = await User.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();

            let token0CurrentInOrder = Big(findUserPosition0?.inOrderBalance ?? 0).plus(data.token0Amount).toNumber();

            if (!ipfs && Number(allowanceToken0) < Number(token0CurrentInOrder)) {
                console.log(`${errorMessage.INSUFFICIENT_ALLOWANCE} token0`);
                return { status: false, error: errorMessage.INSUFFICIENT_ALLOWANCE, statusCode: 400 };
            }

            if (!ipfs && Number(userToken0Balance) < Number(token0CurrentInOrder)) {
                console.log(`${errorMessage.INSUFFICIENT_BALANCE} token0`);
                return { status: false, error: errorMessage.INSUFFICIENT_BALANCE, statusCode: 400 };
            }

            if (findUserPosition0) {
                let _id = findUserPosition0._id.toString();
                await User.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: token0CurrentInOrder } }
                );
            } else {

                User.create(
                    {
                        token: data.token0,
                        chainId: chainId,
                        inOrderBalance: data.tokne0Amount,
                        id: data.maker
                    }
                );

            }
        }

        else if (data.action == Action.CLOSE) {
            //to be done get maker position and check if his debt is less than or equal to closing amount

           
        }

        return { status: true }

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ handleOrderCreated", error);
        return { status: false, error: error.message, statusCode: 500 };
    }
}