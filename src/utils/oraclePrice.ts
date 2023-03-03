// 0x4464b0331deA4D9480a90573149400417249E4F0 address provider
import { promises as fs } from "fs";
import { ethers } from "ethers";
import { getABI, getProvider } from "./utils";
import path from "path";
import { connect, Pair } from "../DB/db";

/**
 * @dev this is use to fetch the oracle price and update it in pairs collection 
 * @param chainId : chainId required in string
 */
async function _getOraclePrice(chainId: string) {
    try {
        const getConfig = (JSON.parse((await fs.readFile(path.join(__dirname + "../../zexe.config1.json"))).toString()))["chainId"][chainId]["spotAddresses"];
        const spotAddresses = Object.keys(getConfig)
        let provider = getProvider(chainId);
        for (let i in spotAddresses) {
            const oracleAddress = getConfig[spotAddresses[i]]["OracleAddress"];
            const getPair = await Pair.find({ spot: spotAddresses[i], chainId: chainId }).lean();

            const pair: string[] = [];
            for (let ele of getPair) {
                pair.push(ele.token0, ele.token1);
            }
            let AaveOracle = new ethers.Contract(oracleAddress, getABI("AaveOracle"), provider);
            let prices = await AaveOracle.getAssetsPrices(pair);

            for (let i = 0; i < getPair.length; i++) {
                if (Number(getPair[i].price0) == Number(prices[2 * i]) && Number(getPair[i].price1) == Number(prices[2 * i + 1])) {
                    continue;
                }
                const updatePairPrice = await Pair.findOneAndUpdate(
                    { _id: getPair[i]._id },
                    { $set: { price0: prices[2 * i].toString() }, price1: prices[2 * i + 1].toString() },
                    { upsert: true, new: true }
                )
                console.log(`Price updated ${updatePairPrice.token0}:${updatePairPrice.price0}, ${updatePairPrice.token1}:${updatePairPrice.price1}`)
            }
        }
    }
    catch (error) {
        console.log(`Error @ getOraclePrice`, error)
    }
}



export async function getOraclePrice(chainId: string) {
    setInterval(async () => {
        await _getOraclePrice(chainId);
    }, 1000 * 10);
}