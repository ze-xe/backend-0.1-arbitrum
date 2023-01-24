import Big from "big.js";
import { ethers } from "ethers";
import * as sentry from "@sentry/node";
import { Token, User } from "../../../DB/db";
import { getLeverAddress } from "../../../helper/chain";
import { errorMessage } from "../../../helper/errorMessage";
import { ifUserPosition } from "../../../helper/interface";
import { multicallFor2Tokens } from "../../../muticall/twoTokenMulticall";
import { getABI, getProvider } from "../../../utils/utils";


export async function marginValidationAndUserPosition(signature: string, data: any, chainId: string, ipfs: boolean | undefined) {
    try {

        let amount = Big(data.amount);
        let a = Big(data.amount);
        let x = Big(data.borrowLimit).div(Big(10).pow(6));
        let n = Number(data.loops) + 1;
        let balanceAmount: string | string[] = Big(a).times((Big(1).minus(Big(x).pow(n))).div(Big(1).minus(x))).minus(a).toString().split(".");

        balanceAmount = balanceAmount[0];
        // console.log(arguments)
        let borrowLimit = Big(data.borrowLimit).div(Big(10).pow(6)).toNumber();

        if (borrowLimit > 0.75 || borrowLimit < 0.05) {
            return { status: false, error: errorMessage.borrowLimit, statusCode: 400 }
        }

        let lever = new ethers.Contract((getLeverAddress(chainId)), getABI("Lever"), getProvider(chainId));

        // checking market enter or not
        let assetIn: string[] = [];

        let multicallData: number[] | null;
        let userToken0Balance = 0;
        let userToken1Balance = 0;
        let allowanceToken0 = 0;
        let allowanceToken1 = 0;

        if (!ipfs) {

            multicallData = await multicallFor2Tokens(data.token0, data.token1, data.maker, chainId);
            assetIn = (await lever.getAssetsIn(data.maker)).map((x: string) => x.toLowerCase());
            // console.log("AssetIn:", assetIn)
            if (multicallData) {
                userToken0Balance = multicallData[0];
                allowanceToken0 = multicallData[1];
                userToken1Balance = multicallData[2];
                allowanceToken1 = multicallData[3]
            }
        }

        const findUserPosition0: ifUserPosition | null = await User.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();
        // for new order , will sell token1
        const findUserPosition1: ifUserPosition | null = await User.findOne({ id: data.maker, token: data.token1, chainId: chainId }).lean();

        let token0CurrentInOrder = Big(findUserPosition0?.inOrderBalance ?? 0).plus(amount).toNumber();

        const token1Amount = data.token1Amount;

        let token1CurrentInOrder = Big(findUserPosition1?.inOrderBalance ?? 0).plus(token1Amount).toNumber();

        if (!ipfs && Number(allowanceToken0) < Number(token0CurrentInOrder)) {
            console.log(`${errorMessage.allowance} token0`);
            return { status: false, error: errorMessage.allowance, statusCode: 400 };
        }
        if (!ipfs && Number(allowanceToken1) < Number(token1CurrentInOrder)) {
            console.log(`${errorMessage.allowance} token1`);
            return { status: false, error: errorMessage.allowance, statusCode: 400 };
        }

        // check market enter or not
        if (!ipfs) {
            let token = data.token0
            if (data.orderType == 3) {
                token = data.token1
            }
            const tokenData = await Token.findOne({ id: token, active: true }).lean()! as any;

            if (!assetIn.includes(tokenData.cId)) {
                return { status: false, error: errorMessage.market, statusCode: 400 }
            }
        }

        if (data.orderType == 2) {

            if (!ipfs && Number(userToken0Balance) < Number(token0CurrentInOrder)) {
                console.log(`${errorMessage.balance} token0`);
                return { status: false, error: errorMessage.balance, statusCode: 400 };
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
                        inOrderBalance: amount.toString(),
                        id: data.maker
                    }
                );

            }
            if (!findUserPosition1) {
                User.create(
                    {
                        token: data.token1,
                        chainId: chainId,
                        inOrderBalance: '0',
                        id: data.maker
                    }
                );
            }
        }

        else if (data.orderType == 3) {

            if (!ipfs && Number(userToken1Balance) < Number(token1CurrentInOrder)) {
                console.log(`${errorMessage.balance} token1`);
                return { status: false, error: errorMessage.balance, statusCode: 400 };
            }

            if (findUserPosition1) {

                let _id = findUserPosition1._id.toString();
                await User.findOneAndUpdate(
                    { _id: _id },
                    { $set: { inOrderBalance: token1CurrentInOrder } }
                );
            } else {

                User.create(
                    {
                        token: data.token1,
                        chainId: chainId,
                        inOrderBalance: token1Amount,
                        id: data.maker
                    }
                );

            }
            if (!findUserPosition0) {
                User.create(
                    {
                        token: data.token0,
                        chainId: chainId,
                        inOrderBalance: '0',
                        id: data.maker
                    }
                );
            }

        }

        return { status: true, balanceAmount: balanceAmount }

    }
    catch (error: any) {
        sentry.captureException(error)
        console.log("Error @ handleOrderCreated", error);
        return { status: false, error: error.message, statusCode: 500 };
    }
}