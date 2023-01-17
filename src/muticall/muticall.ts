

import { BigNumber, ethers } from "ethers";
import { getERC20ABI, getProvider, getInterface, MulticallAbi } from "../utils/utils";
import { getExchangeAddress, MulticallAddress } from "../helper/chain";
import { sentry } from "../../app";






/**
 * @dev this function is use to get onchain data for create order api, i.e balance and allowance
 * @param {*} token (string) address of token 
 * @param {*} maker (string) address of maker
 * @param {*} chainId (string) numeric chainId
 * @returns ([number])) [balance, allowance]
 */

export async function multicall(token: string, maker: string, chainId: string): Promise<number[] | null> {
    try {
       
        const provider: ethers.providers.JsonRpcProvider = getProvider(chainId);

        const multicall = new ethers.Contract(
            MulticallAddress[`${chainId}`],
            MulticallAbi,
            provider
        );

        const itf: ethers.utils.Interface = getInterface(getERC20ABI());
        const input: string[][] = [[token, itf.encodeFunctionData("balanceOf", [maker])], [token, itf.encodeFunctionData("allowance", [maker, getExchangeAddress(chainId)])]]
        let resp = await multicall.callStatic.aggregate(
            input
        );

        let outPut: number[] = [];
       
        for (let i in resp[1]) {
            outPut.push(Number(BigNumber.from(resp[1][i]).toString()))
        }
        // console.log(outPut);
        return outPut


    }
    catch (error) {
        sentry.captureException(error)
        console.log(`Error @ Multicall`, error)
        return null
    }
}