

import { BigNumber, ethers } from "ethers";
import { User, Order } from "../DB/db";
import Big from "big.js";
import { getProvider, getInterface, getABI } from "../utils/utils";
import { ifOrderCreated, ifUserPosition, orderSignature } from "../helper/interface";
import * as sentry from "@sentry/node";
import { getMulticallAddress } from "../helper/chain";
import { Action } from "../controllers/order/helper/marginValidationUserPosition";




/**
 * @dev this function is used to check weather the fetched order is still active or not
 * @notice its check if maker has sufficeint token or not, and remove invalid data, update as inActive in DB
 * @param {*} token (string) address of token
 * @param {*} addresses ([string]) addresses of user
 * @param {*} ids ([string]) ids of orders
 * @param {*} data (object) document from DB
 * @param {*} chainId (string) numeric chainId
 * @param {*} amounts ([string]) numeric amounts of repective orders
 * @returns (object) only valid order send 
 */
export async function getMultiBalance(token: string, addresses: string[], data: ifOrderCreated[], chainId: string, pairToken0: string) {

    const _getMultiBalance = async () => {
        try {

            const multicall: ethers.Contract = new ethers.Contract(
                getMulticallAddress(chainId),
                getABI("Multicall2"),
                getProvider(chainId)
            );

            const itf: ethers.utils.Interface = getInterface(getABI("MockToken"));

            const resp: any = await multicall.callStatic.aggregate(

                addresses.map((add: string) => {
                    return [
                        token,
                        itf.encodeFunctionData("balanceOf", [add]),
                    ];
                })

            );

            let inActiveIds: string[] = [];
            for (let i = 0; i < resp[1].length; i++) {

                let balance = BigNumber.from(resp[1][i]).toString();
                let userPosition: ifUserPosition = await User.findOne({ token: token, id: addresses[i], chainId: chainId }).lean();
                let inOrderBalance = Big(userPosition.inOrderBalance);
                let amounts = data[i].balanceAmount;
                if (Number(balance) < Number(inOrderBalance) || Date.now() / 1e3 >= Number(data[i].expiry)) {
                    inActiveIds.push(data[i]._id);

                    if (data[i].action != Action.CLOSE) {

                        if (data[i].action == Action.LIMIT) {

                            if (pairToken0 != data[i].token1) {
                                amounts = Big(data[i].balanceAmount).times(data[i].price).div(1e18).toString();
                            }

                            let currentInOrderBalance = Big(inOrderBalance).minus(amounts).toString();

                            await User.findOneAndUpdate({ token: token, id: addresses[i], chainId: chainId }, { $set: { inOrderBalance: currentInOrderBalance } });

                        }
                        else if (data[i].action == Action.OPEN) {
                            let token0Amount = data[i].balanceAmount;
                            if (pairToken0 != data[i].token0) {
                                token0Amount = Big(data[i].balanceAmount).div(data[i].price).mul(1e18).toString();
                            }
                            let token0InOrder = Big(inOrderBalance).minus(Big(token0Amount).div(Big(Number(data[i].leverage) - 1)));
                            await User.findOneAndUpdate({ token: token, id: addresses[i], chainId: chainId }, { $set: { inOrderBalance: token0InOrder } });
                        }
                    }

                    let temp: any = {
                        active: false
                    }

                    if (Date.now() / 1e3 >= Number(data[i].expiry)) {
                        temp = {
                            active: false,
                            expired: true
                        }
                    }
                    console.log("Order Deactivate from getMultiBalance", data[i].id)
                    await Order.findOneAndUpdate({ _id: data[i]._id }, { $set: temp });
                }
            }

            let res: any[] = [];

            for (let i in data) {

                if (inActiveIds.includes(data[i]._id)) {
                    continue;
                }
                else {
                    res.push({
                        signature: data[i].signature,
                        id: data[i].id,
                        value: {
                            maker: data[i].maker,
                            token0: data[i].token0,
                            token1: data[i].token1,
                            token0Amount: data[i].token0Amount,
                            token1Amount: data[i].token1Amount,
                            leverage: data[i].leverage,
                            price: data[i].price,
                            expiry: data[i].expiry,
                            nonce: data[i].nonce,
                            action: data[i].action,
                            position: data[i].position,

                        }
                    });
                }
            }
            return res;
        } catch (error) {
            sentry.captureException(error);
            console.log("Error @ getMultiBalance", error);
            return null

        }
    };
    return _getMultiBalance();
}
