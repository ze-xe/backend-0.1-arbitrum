
import { ethers } from "ethers";
import { PairCreated } from "../../../db";
import { handleToken } from "../../../handlers/token";
import { ifPairCreated } from "../../../helper/interface";






export async function getPairId(data: any, chainId: any){
    try{

        let isPairExist: ifPairCreated = await PairCreated.findOne({ token0: data.token0, token1: data.token1, chainId: chainId, active: true }).lean();
        let createPair: ifPairCreated | any;

        if (!isPairExist) {
            // cheking for opposite pair
            let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [data.token1, data.token0]);
            let id = ethers.utils.keccak256(encoder);

            let isPairExist1: ifPairCreated = await PairCreated.findOne({ id: id, active: true }).lean();;

            if (isPairExist1) {
                createPair = isPairExist1;
            }

            if (!isPairExist1) {
                let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [data.token0, data.token1]);
                let id = ethers.utils.keccak256(encoder);

                let token0 = await handleToken(data.token0, chainId);
                let token1 = await handleToken(data.token1, chainId);
                let marginEnabled = false;
                if (token0?.marginEnabled == true && token1?.marginEnabled == true) {
                    marginEnabled = true
                }
                let temp = {
                    id: id,
                    exchangeRateDecimals: data.exchangeRateDecimals,
                    minToken0Order: token0?.minToken0Amount,
                    exchangeRate: '0',
                    priceDiff: '0',
                    token0: data.token0,
                    token1: data.token1,
                    chainId: chainId,
                    symbol: `${token0?.symbol}_${token1?.symbol}`,
                    marginEnabled: marginEnabled,
                    active: true
                }
                createPair = await PairCreated.create(temp);

                console.log("Pair Created ", "T0 ", data.token0, "T1 ", data.token1, "CId ", chainId);

            }

        }
        let pair: string;
        if (isPairExist) {
            pair = isPairExist.id?.toString();
        }
        else {
            pair = createPair.id.toString();
        }
        return pair
    }
    catch(error){
        console.log(`error at getPairId`, error);
        return null
    }
}