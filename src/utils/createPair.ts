import fs from "fs";
import path from "path";
import { getAAndVToken } from "../helper/getAAndVToken";
import { connect, Pair, Token } from "../DB/db";




/**
 * @dev : it use to create pair for chainId and its spot address, it is also called getOraclePrice(), which is use to get oracle price of pair token
 * @notice set all the addresses in lowerCase in config file 
 * @param chainId : chainId in stringg
 * @returns : it return nothing
 */


// export async function _createPair(chainId: string) {

//     const getConfig = JSON.parse((fs.readFileSync(path.join(__dirname + "../../zexe.config.json"))).toString());

//     // geting all the spot address
//     const spotAddresses = Object.keys(getConfig[chainId]);
//     const spotPairs: any = []
//     // storing pair address correspondence to spot address
//     for (let i in spotAddresses) {
//         const pairsAddresses = Object.keys(getConfig[chainId][spotAddresses[i]]);
//         spotPairs.push([spotAddresses[i], pairsAddresses])
//     }

//     for (let i in spotPairs) {
//         let spotAddress = spotPairs[i][0].toLowerCase();
//         for (let j in spotPairs[i][1]) {
//             let pair = spotPairs[i][1][j];
//             let token0 = getConfig[chainId][spotAddress][pair][0];
//             let token1 = getConfig[chainId][spotAddress][pair][1];
//             let isToken0Exist: any = Token.findOne({ id: token0.address.toLowerCase(), spot: spotAddress, chainId: chainId }).lean();
//             let isToken1Exist: any = Token.findOne({ id: token1.address.toLowerCase(), spot: spotAddress, chainId: chainId }).lean();
//             let isPairExist: any = Pair.findOne({ id: pair, spot: spotAddress, chainId: chainId }).lean();
//             const promise = await Promise.all(
//                 [
//                     isToken0Exist,
//                     isToken1Exist,
//                     isPairExist
//                 ]
//             )
//             isToken0Exist = promise[0];
//             isToken1Exist = promise[1];
//             isPairExist = promise[2];

//             if (!isToken0Exist) {
//                 await Token.create(
//                     {
//                         id: token0.address.toLowerCase(),
//                         symbol: token0.symbol,
//                         name: token0.name,
//                         decimals: token0.decimals,
//                         spot: spotAddress,
//                         chainId: chainId,
//                         minTokenAmount: token0.minTokenAmount
//                     }
//                 )
//                 console.log(`Token created, ${token0.name}`);
//             }
//             if (!isToken1Exist) {

//                 await Token.create(
//                     {
//                         id: token1.address.toLowerCase(),
//                         symbol: token1.symbol,
//                         name: token1.name,
//                         decimals: token1.decimals,
//                         spot: spotAddress,
//                         chainId: chainId,
//                         minTokenAmount: token1.minTokenAmount
//                     }
//                 )
//                 console.log(`Token created, ${token1.name}`);
//             }
//             if (!isPairExist) {
//                 let aAndVToken = await getAAndVToken(getConfig["poolAddress"][spotAddress], token0.address, token1.address, chainId);
//                 await Pair.create({
//                     id: pair,
//                     priceDecimals: 2,
//                     minToken0Order: token0.minTokenAmount,
//                     spot: spotAddress,
//                     price: '0',
//                     priceDiff: '0',
//                     token0: token0.address.toLowerCase(),
//                     token1: token1.address.toLowerCase(),
//                     atoken0: aAndVToken?.aToken0.toLowerCase(),
//                     atoken1: aAndVToken?.aToken1.toLowerCase(),
//                     vtoken0: aAndVToken?.vToken0.toLowerCase(),
//                     vtoken1: aAndVToken?.vToken1.toLowerCase(),
//                     ltv0: aAndVToken?.ltv0,
//                     ltv1: aAndVToken?.ltv1,
//                     liqThreshold0: aAndVToken?.liqThreshold0,
//                     liqThreshold1: aAndVToken?.liqThreshold1,
//                     liqBonus0: aAndVToken?.liqBonus0,
//                     liqBonus1: aAndVToken?.liqBonus1,
//                     decimals0: aAndVToken?.decimals0,
//                     decimals1: aAndVToken?.decimals1,
//                     chainId: chainId,
//                     symbol: `${token0?.symbol}_${token1.symbol}`,
//                     active: true,

//                 })
//                 console.log(`Pair created, ${token0?.symbol}_${token1.symbol}`)
//             }
//         }
//     }
//     return
// }

export async function createPair(chainId: string) {
    
    const getConfig = JSON.parse((fs.readFileSync(path.join(__dirname + "../../zexe.config.json"))).toString());

    // geting all the spot address
    const spotAddresses = Object.keys(getConfig["chainId"][chainId]["spotAddresses"]);
    const spotPairs: any = []
   // storing pair address correspondence to spot address
    for (let i in spotAddresses) {
        const pairsAddresses = Object.keys(getConfig["chainId"][chainId]["spotAddresses"][spotAddresses[i]]["pair"]["pairIdAndToken"]);
        spotPairs.push([spotAddresses[i], pairsAddresses]);
    }
    
    for (let i in spotPairs) {
        let spotAddress = spotPairs[i][0].toLowerCase();
        for (let j in spotPairs[i][1]) {
            let pair = spotPairs[i][1][j];
            let tokenConfigPath = getConfig["chainId"][chainId]["spotAddresses"][spotAddress]["pair"];
            let token0 = tokenConfigPath["pairIdAndToken"][pair][0];
            let token1 = tokenConfigPath["pairIdAndToken"][pair][1];
            
            let isToken0Exist: any = Token.findOne({ id: token0.address.toLowerCase(), spot: spotAddress, chainId: chainId }).lean();
            let isToken1Exist: any = Token.findOne({ id: token1.address.toLowerCase(), spot: spotAddress, chainId: chainId }).lean();
            let isPairExist: any = Pair.findOne({ id: pair, spot: spotAddress, chainId: chainId }).lean();
            const promise = await Promise.all(
                [
                    isToken0Exist,
                    isToken1Exist,
                    isPairExist
                ]
            )
            isToken0Exist = promise[0];
            isToken1Exist = promise[1];
            isPairExist = promise[2];

            if (!isToken0Exist) {
                await Token.create(
                    {
                        id: token0.address.toLowerCase(),
                        symbol: token0.symbol,
                        name: token0.name,
                        decimals: token0.decimals,
                        spot: spotAddress,
                        chainId: chainId,
                        minTokenAmount: token0.minTokenAmount
                    }
                )
                console.log(`Token created, ${token0.name}`);
            }
            if (!isToken1Exist) {

                await Token.create(
                    {
                        id: token1.address.toLowerCase(),
                        symbol: token1.symbol,
                        name: token1.name,
                        decimals: token1.decimals,
                        spot: spotAddress,
                        chainId: chainId,
                        minTokenAmount: token1.minTokenAmount
                    }
                )
                console.log(`Token created, ${token1.name}`);
            }
            if (!isPairExist) {
                const poolAddress = getConfig["chainId"][chainId]["spotAddresses"][spotAddress]["poolAddress"].toLowerCase()
                let aAndVToken = await getAAndVToken(poolAddress, token0.address, token1.address, chainId);
                await Pair.create({
                    id: pair,
                    priceDecimals: 2,
                    minToken0Order: token0.minTokenAmount,
                    spot: spotAddress,
                    price: '0',
                    priceDiff: '0',
                    token0: token0.address.toLowerCase(),
                    token1: token1.address.toLowerCase(),
                    atoken0: aAndVToken?.aToken0.toLowerCase(),
                    atoken1: aAndVToken?.aToken1.toLowerCase(),
                    vtoken0: aAndVToken?.vToken0.toLowerCase(),
                    vtoken1: aAndVToken?.vToken1.toLowerCase(),
                    ltv0: aAndVToken?.ltv0,
                    ltv1: aAndVToken?.ltv1,
                    liqThreshold0: aAndVToken?.liqThreshold0,
                    liqThreshold1: aAndVToken?.liqThreshold1,
                    liqBonus0: aAndVToken?.liqBonus0,
                    liqBonus1: aAndVToken?.liqBonus1,
                    decimals0: aAndVToken?.decimals0,
                    decimals1: aAndVToken?.decimals1,
                    chainId: chainId,
                    symbol: `${token0?.symbol}_${token1.symbol}`,
                    active: true,

                })
                console.log(`Pair created, ${token0?.symbol}_${token1.symbol}`)
            }
        }
    }
    return
}


