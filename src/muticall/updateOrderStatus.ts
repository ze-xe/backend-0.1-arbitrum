import { BigNumber, ethers } from "ethers";
import { User, Order } from "../DB/db";
import Big from "big.js";
import { getABI, getProvider, getInterface } from "../utils/utils";
import { ifOrderCreated, ifUserPosition } from "../helper/interface";
import * as sentry from "@sentry/node";
import { getMulticallAddress } from "../helper/chain";
import { Action } from "../controllers/order/helper/marginValidationUserPosition";







/**
 * @dev this function will run periodically e.g 30 min etc, it will check all the orders, for there maker balance and order amount, if order is active = false and now the user have sufficient balance then it will change its status to true, if order is active but now user does not have sufficient token then it will change its status to false 
 * @param {*} chainId (string) numeric chainId
 */
async function orderStatus(chainId: string) {
    try {

        const multicall: ethers.Contract = new ethers.Contract(
            getMulticallAddress(chainId),
            getABI("Multicall2"),
            getProvider(chainId)
        );

        const itf: ethers.utils.Interface = getInterface(getABI("MockToken"));
        let hasOrder: boolean = true;
        let page: number = 0;
        const _limit = 20;

        while (hasOrder == true) {
            const getOrderCreated: ifOrderCreated[] = await Order.find({ deleted: false, cancelled: false, chainId: chainId, action: { $in: [0, 2] } }).skip(page * _limit).limit(_limit).lean();
            if (getOrderCreated.length == 0) {
                hasOrder = false;
                break;
            }
            page++;

            let input: any = [];

            // creating input for multicall
            for (let k in getOrderCreated) {

                if (getOrderCreated[k].action == Action.LIMIT) {

                    input.push([getOrderCreated[k].token1, itf.encodeFunctionData("balanceOf", [getOrderCreated[k].maker])]);

                }
                else if (getOrderCreated[k].action == Action.OPEN) {

                    input.push([getOrderCreated[k].token0, itf.encodeFunctionData("balanceOf", [getOrderCreated[k].maker])]);
                }
            }

            let resp: any = await multicall.callStatic.aggregate(input);

            for (let i = 0; i < resp[1].length; i++) {

                let balance: string = BigNumber.from(resp[1][i]).toString();

                let token: string = '';
                let amount: Big = Big(0);
                let id = getOrderCreated[i].maker;

                if (getOrderCreated[i].action == Action.LIMIT) {
                    token = getOrderCreated[i].token1;
                    amount = Big(getOrderCreated[i].balanceAmount);

                    if (Number(getOrderCreated[i].token0Amount) < Number(getOrderCreated[i].token1Amount)) {
                        amount = Big(amount).times(getOrderCreated[i].price).div(1e18);
                    }

                }
                else if (getOrderCreated[i].action == Action.OPEN) {
                    token = getOrderCreated[i].token0;
                    amount = Big(getOrderCreated[i].balanceAmount);

                    if (Number(getOrderCreated[i].token0Amount) > Number(getOrderCreated[i].token1Amount)) {
                        amount = Big(amount).times(getOrderCreated[i].price).div(1e18);
                    }

                    amount = Big(amount).div(getOrderCreated[i].leverage - 1)
                }
                else if (getOrderCreated[i].action == Action.CLOSE) {
                    continue;
                }


                if (getOrderCreated[i].active == true) {

                    const getUserPos: ifUserPosition = await User.findOne({ token: token, id: id, chainId: chainId }).lean();

                    let inOrderBalance = Big(getUserPos.inOrderBalance);

                    if (Number(inOrderBalance) > Number(balance) || Date.now() / 1e3 >= Number(getOrderCreated[i].expiry)) {
                        let temp: any = { active: false };
                        if (Date.now() / 1e3 >= Number(getOrderCreated[i].expiry)) temp = { active: false, expired: true };
                        let currentInOrderBalance = Big(inOrderBalance).minus(amount).toString();
                        // updating inOrderBalance and active
                        await Promise.all([
                            Order.findOneAndUpdate({ _id: getOrderCreated[i]._id }, { $set: temp }),
                            User.findOneAndUpdate({ _id: getUserPos._id }, { $set: { inOrderBalance: currentInOrderBalance } })
                        ]);
                        console.log("inactive", getOrderCreated[i].id, getUserPos.id);
                    }
                }
                else if (getOrderCreated[i].active == false && Date.now() / 1e3 < Number(getOrderCreated[i].expiry)) {

                    const getUserPos: ifUserPosition = await User.findOne({ token: token, id: getOrderCreated[i].maker, chainId: getOrderCreated[i].chainId }).lean();

                    let inOrderBalance = Big(getUserPos.inOrderBalance).plus(amount).toString();

                    await Promise.all([
                        Order.findOneAndUpdate({ _id: getOrderCreated[i]._id }, { $set: { active: true } }),
                        User.findOneAndUpdate({ _id: getUserPos._id }, { $set: { inOrderBalance: inOrderBalance } })
                    ]);
                    console.log("active", getOrderCreated[i].id, getUserPos.id);

                }
            }

        }

    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ orderStatus", error);
    }
}

export async function startOrderStatus(chainId: string) {
    setInterval(async () => {
        console.log("order status start running");
        await orderStatus(chainId);
        console.log("order status done updating");
    }, 1000 * 60 * 30);
}



