import { BigNumber, ethers } from "ethers";
import { getProvider, getInterface, getABI } from "../utils/utils";
import { getExchangeAddress, getMulticallAddress } from "../helper/chain";
import * as sentry from "@sentry/node";





export async function multicallFor2Tokens(token0: string, token1: string, maker: string, chainId: string): Promise<number[] | null> {
    try {
        // console.log("Multicall from fun", getMulticallAddress(chainId))
        const multicall = new ethers.Contract(
            getMulticallAddress(chainId),
            getABI("Multicall2"),
            getProvider(chainId)
        );

        const itf: ethers.utils.Interface = getInterface(getABI("TestERC20"));
        const input: string[][] = [
            [token0, itf.encodeFunctionData("balanceOf", [maker])],
            [token0, itf.encodeFunctionData("allowance", [maker, getExchangeAddress(chainId)])],
            [token1, itf.encodeFunctionData("balanceOf", [maker])],
            [token1, itf.encodeFunctionData("allowance", [maker, getExchangeAddress(chainId)])]
        ]
        let resp = await multicall.callStatic.aggregate(
            input
        );

        let outPut: number[] = [];

        for (let i in resp[1]) {
            outPut.push(Number(BigNumber.from(resp[1][i]).toString()))
        }
        // console.log(outPut)
        return outPut
    }
    catch (error) {
        sentry.captureException(error)
        console.log(`Error @ multicallFor2Tokens`, error)
        return null
    }
}
