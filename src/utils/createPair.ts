import { promises as fs } from "fs";
import path from "path";
import { connect, Pair, Token } from "../DB/db";


// (async function a (){
//     let b = (await fs.readFile(path.join(__dirname + "../../zexe.config.json"),"utf-8")).toString()
//     console.log(b)
// })()





export async function createPair(chainId: string) {
    await connect()
    const getConfig = await (JSON.parse((await fs.readFile(path.join(__dirname + "../../zexe.config.json"))).toString())[chainId]);
    const spotAddresses = Object.keys(getConfig);
    const spotPairs: any = []
    for (let i in spotAddresses) {
        const pairsAddresses = Object.keys(getConfig[spotAddresses[i]]);
        spotPairs.push([spotAddresses[i], pairsAddresses])
    }

    for (let i in spotPairs) {
        let spotAddress = spotPairs[i][0].toLowerCase();
        for (let j in spotPairs[i][1]) {
            let pair = spotPairs[i][1][j].toLowerCase();
            let token0 = getConfig[spotAddress][pair][0];
            let token1 = getConfig[spotAddress][pair][1];
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
                Pair.create({
                    id: pair,
                    priceDecimals: 2,
                    minToken0Order: token0.minTokenAmount,
                    spot: spotAddress,
                    price: '0',
                    priceDiff: '0',
                    token0: token0.address.toLowerCase(),
                    token1: token1.address.toLowerCase(),
                    chainId: chainId,
                    symbol: `${token0?.symbol}_${token1.symbol}`,
                    active: true
                })
                console.log(`Pair created, ${token0?.symbol}_${token1.symbol}`)
            }

        }
    }
    return
}

// createPair("421613")