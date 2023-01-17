

import { BigNumber, ethers } from "ethers";
import { UserPosition, OrderCreated } from "../DB/db";
import Big from "big.js";
import { getERC20ABI, getProvider, getInterface, MulticallAbi } from "../utils/utils";
import { ifOrderCreated, ifUserPosition, orderSignature } from "../helper/interface";
import { MulticallAddress } from "../helper/chain";
import { sentry } from "../../app";







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
export async function getMultiBalance(token: string, addresses: string[], ids: string[], data: ifOrderCreated[], chainId: string, amounts: number[]) {

    const _getMultiBalance = async () => {
        try {
            const provider: ethers.providers.JsonRpcProvider = getProvider(chainId);

            const multicall: ethers.Contract = new ethers.Contract(
                MulticallAddress[`${chainId}`],
                MulticallAbi,
                provider
            );


            const itf: ethers.utils.Interface = getInterface(getERC20ABI());


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
                let userPosition: ifUserPosition = await UserPosition.findOne({ token: token, id: addresses[i], chainId: chainId }).lean();
                let inOrderBalance = Big(userPosition.inOrderBalance);

                if (Number(balance) < Number(inOrderBalance)) {
                    inActiveIds.push(ids[i]);
                    let currentInOrderBalance = Big(inOrderBalance).minus(amounts[i]).toString();

                    let updateUserPosition = UserPosition.findOneAndUpdate({ token: token, id: addresses[i], chainId: chainId }, { $set: { inOrderBalance: currentInOrderBalance } });
                    console.log("Order Deactivate", data[i].id)
                    let deleteOrder = OrderCreated.findOneAndUpdate({ _id: ids[i] }, { $set: { active: false } });
                    await Promise.all([updateUserPosition, deleteOrder]);
                }

            }

            let res: orderSignature[] = [];

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
                            amount: data[i].amount,
                            orderType: data[i].orderType,
                            salt: data[i].salt,
                            exchangeRate: data[i].exchangeRate,
                            borrowLimit: data[i].borrowLimit,
                            loops: data[i].loops
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
