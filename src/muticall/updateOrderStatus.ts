import { BigNumber, ethers } from "ethers";
import { UserPosition, OrderCreated } from "../db";
import Big from "big.js";
import { getERC20ABI, getProvider, getInterface, MulticallAbi } from "../utils/utils";
import { ifOrderCreated, ifUserPosition, orderSignature } from "../helper/interface";
import { getExchangeAddress, MulticallAddress } from "../helper/chain";
import { sentry } from "../../app";







/**
 * @dev this function will run periodically e.g 30 min etc, it will check all the orders, for there maker balance and order amount, if order is active = false and now the user have sufficient balance then it will change its status to true, if order is active but now user does not have sufficient token then it will change its status to false 
 * @param {*} chainId (string) numeric chainId
 */
async function orderStatus(chainId: string) {
    try {

        const provider: ethers.providers.JsonRpcProvider = getProvider(chainId);

        const multicall: ethers.Contract = new ethers.Contract(
            MulticallAddress[`${chainId}`],
            MulticallAbi,
            provider
        );

        const itf: ethers.utils.Interface = getInterface(getERC20ABI());
        let hasOrder: boolean = true;
        let page: number = 0;
        const _limit = 20;

        while (hasOrder == true) {
            const getOrderCreated: ifOrderCreated[] = await OrderCreated.find({ deleted: false, cancelled: false, chainId: chainId }).skip(page * _limit).limit(_limit).lean();
            if (getOrderCreated.length == 0) {
                hasOrder = false;
                break;
            }
            page++;

            let input: any = [];

            // creating input for multicall
            for (let k in getOrderCreated) {

                if (getOrderCreated[k].orderType == 1 || getOrderCreated[k].orderType == 3) {

                    input.push([getOrderCreated[k].token0, itf.encodeFunctionData("balanceOf", [getOrderCreated[k].maker])]);

                }
                else if (getOrderCreated[k].orderType == 0 || getOrderCreated[k].orderType == 2) {

                    input.push([getOrderCreated[k].token1, itf.encodeFunctionData("balanceOf", [getOrderCreated[k].maker])]);
                }
            }

            let resp: any = await multicall.callStatic.aggregate(input);

            for (let i = 0; i < resp[1].length; i++) {

                let balance: string = BigNumber.from(resp[1][i]).toString();

                let token: string = '';
                let amount: Big = Big(0);
                let id = getOrderCreated[i].maker;

                if (getOrderCreated[i].orderType == 1 || getOrderCreated[i].orderType == 3) {
                    token = getOrderCreated[i].token0;
                    amount = Big(getOrderCreated[i].balanceAmount);
                    if (getOrderCreated[i].orderType == 3) {
                        amount = Big(getOrderCreated[i].amount);
                    }
                }
                else if (getOrderCreated[i].orderType == 0 || getOrderCreated[i].orderType == 2) {
                    token = getOrderCreated[i].token1;
                    amount = Big(getOrderCreated[i].balanceAmount).times(getOrderCreated[i].exchangeRate).div(Big(10).pow(18));
                    if (getOrderCreated[i].orderType == 2) {
                        amount = Big(getOrderCreated[i].amount).times(getOrderCreated[i].exchangeRate).div(Big(10).pow(18));
                    }
                }

                if (getOrderCreated[i].active == true) {

                    const getUserPos: ifUserPosition = await UserPosition.findOne({ token: token, id: id, chainId: chainId }).lean();

                    let inOrderBalance = Big(getUserPos.inOrderBalance);

                    if (Number(inOrderBalance) > Number(balance)) {
                        let currentInOrderBalance = Big(inOrderBalance).minus(amount).toString();
                        // updating inOrderBalance and active
                        await Promise.all([OrderCreated.findOneAndUpdate({ _id: getOrderCreated[i]._id }, { $set: { active: false } }),
                        UserPosition.findOneAndUpdate({ _id: getUserPos._id }, { $set: { inOrderBalance: currentInOrderBalance } })]);
                        console.log("inactive", getOrderCreated[i].id, getUserPos.id);
                    }
                }
                else if (getOrderCreated[i].active == false) {

                    const getUserPos: ifUserPosition = await UserPosition.findOne({ token: token, id: getOrderCreated[i].maker, chainId: getOrderCreated[i].chainId }).lean();

                    let inOrderBalance = Big(getUserPos.inOrderBalance).plus(amount).toString();

                    if (Number(inOrderBalance) < Number(balance)) {

                        await Promise.all([OrderCreated.findOneAndUpdate({ _id: getOrderCreated[i]._id }, { $set: { active: true } }),
                        UserPosition.findOneAndUpdate({ _id: getUserPos._id }, { $set: { inOrderBalance: inOrderBalance } })]);
                        console.log("active", getOrderCreated[i].id, getUserPos.id);
                    }
                }
            }

        }

    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ orderStatus", error);
    }
}

export function startOrderStatus(chainId: string) {
    setInterval(async () => {
        console.log("order status start running");
        await orderStatus(chainId);
        console.log("order status done updating");
    }, 1000 * 60 * 30);
}


