


import { ethers } from "ethers";
import { getABI, getProvider } from "../utils/utils";


export async function getAAndVToken(poolAddress: string, token0: string, token1: string, chainId: string) {

    try {

        let provider = getProvider(chainId);

        let Pool = new ethers.Contract(poolAddress, getABI("IPool"), provider);
        const asset0 = await Pool.getReserveData(token0);
        const asset1 = await Pool.getReserveData(token1);
        let aToken0 = asset0[8];
        let aToken1 = asset1[8];
        let vToken0 = asset0[10];
        let vToken1 = asset1[10];
        let hexString0 = asset0[0][0]["_hex"];
        let hexString1 = asset1[0][0]["_hex"];
        // fetch the value from configuration hex string in reverse order
        let ltv0 = parseInt(hexString0.slice(hexString0.length - 4, hexString0.length), 16);
        let liqThreshold0 = parseInt(hexString0.slice(hexString0.length - 8, hexString0.length - 4), 16);
        let liqBonus0 = parseInt(hexString0.slice(hexString0.length - 12, hexString0.length - 8), 16);
        let decimals0 = parseInt(hexString0.slice(hexString0.length - 14, hexString0.length - 12), 16);

        let ltv1 = parseInt(hexString1.slice(hexString1.length - 4, hexString1.length), 16);
        let liqThreshold1 = parseInt(hexString1.slice(hexString1.length - 8, hexString1.length - 4), 16);
        let liqBonus1 = parseInt(hexString1.slice(hexString1.length - 12, hexString1.length - 8), 16);
        let decimals1 = parseInt(hexString1.slice(hexString1.length - 14, hexString1.length - 12), 16);

        return {
            aToken0, aToken1, vToken0, vToken1,
            ltv0,
            liqThreshold0,
            liqBonus0,
            decimals0,
            ltv1,
            liqThreshold1,
            liqBonus1,
            decimals1
        }

    }
    catch (error) {
        console.log(`Error @ getUserPoolPosition`, error)
    }
}
