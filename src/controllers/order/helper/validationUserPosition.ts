import Big from "big.js";
import { UserPosition } from "../../../db";
import { errorMessage } from "../../../helper/errorMessage";
import { ifUserPosition } from "../../../helper/interface";
import { multicall } from "../../../sync/syncBalance";





export async function validationAndUserPosition(data: any, chainId: string, ipfs: boolean | undefined) {
    try {

        let findUserPosition;
        let multicallData: number[] | null;
        let userTokenBalance = 0;
        let allowance = 0;
        let token;
        let amount = data.amount;
        if (data.orderType == 1) {
            const findUserPosition: ifUserPosition | null = await UserPosition.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();
            if (!ipfs) {
                multicallData = await multicall(data.token0, data.maker, chainId)
                if (multicallData) {
                    userTokenBalance = multicallData[0];
                    allowance = multicallData[1];
                }
            }
            token = data.token0
        }
        else if (data.orderType == 0) {
            findUserPosition = await UserPosition.findOne({ id: data.maker, token: data.token1, chainId: chainId }).lean();
            if (!ipfs) {
                multicallData = await multicall(data.token1, data.maker, chainId)
                if (multicallData) {
                    userTokenBalance = multicallData[0];
                    allowance = multicallData[1];
                }
            }
            token = data.token1
            amount = Big(data.amount).times(data.exchangeRate).div(Big(10).pow(18));
        }

        if (findUserPosition) {

            let _id = findUserPosition._id.toString();

            let currentInOrderBalance = Big(findUserPosition.inOrderBalance).plus(amount).toString();

            if (!ipfs && Number(allowance) < Number(currentInOrderBalance)) {
                console.log(`${errorMessage.allowance, token}`);
                return { status: false, error: errorMessage.allowance, statusCode: 400 };
            }

            if (!ipfs && Number(userTokenBalance) < Number(currentInOrderBalance)) {
                console.log(`${errorMessage.balance, token}`);
                return { status: false, error: errorMessage.balance, statusCode: 400 };
            }

            await UserPosition.findOneAndUpdate(
                { _id: _id },
                { $set: { inOrderBalance: currentInOrderBalance } }
            );
        } else {

            if (!ipfs && Number(allowance) < Number(amount)) {
                console.log(`${errorMessage.allowance, token}`);
                return { status: false, error: errorMessage.allowance, statusCode: 400 };
            }

            if (!ipfs && Number(userTokenBalance) < Number(amount)) {
                console.log(`${errorMessage.balance, token}`);
                return { status: false, error: errorMessage.balance, statusCode: 400 };
            }

            UserPosition.create(
                {
                    token: token,
                    chainId: chainId,
                    inOrderBalance: amount.toString(),
                    id: data.maker
                }
            );

        }

        return { status: true}


    }
    catch (error) {
        console.log(`error @ validationAndUserPosition`)
        return {status: false, error: errorMessage.server, statusCode: 500}
    }
}