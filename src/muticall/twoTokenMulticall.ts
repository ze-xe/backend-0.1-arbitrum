import { BigNumber, ethers } from "ethers";
import { getERC20ABI, getProvider, getInterface, MulticallAbi } from "../utils/utils";
import { getExchangeAddress, getMulticallAddress } from "../helper/chain";
import { sentry } from "../../app";





export async function multicallFor2Tokens(token0: string, token1: string, maker: string, chainId: string): Promise<number[] | null> {
    try {

        const provider: ethers.providers.JsonRpcProvider = getProvider(chainId);
        const multicall = new ethers.Contract(
            getMulticallAddress(chainId),
            MulticallAbi,
            provider
        );

        const itf: ethers.utils.Interface = getInterface(getERC20ABI());
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
        console.log(outPut)
        return outPut
    }
    catch (error) {
        sentry.captureException(error)
        console.log(`Error @ multicallFor2Tokens`, error)
        return null
    }
}
