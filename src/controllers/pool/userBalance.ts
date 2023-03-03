import { ethers } from "ethers";
import { connect, Pair, UserPosition } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";
import { getPoolTokensMultiBalance } from "../../muticall/poolTokens";





/**
 * @dev this function will provide makers all position balance correspondence to tokens available in perticular chainId
 * @param chainId: chainId is required 
 * @param maker: maker public key is required 
 * @returns 
 */
// export async function _getUserPoolBalance(req: any, res: any) {
//     try {

//         const chainId = req.query.chainId;
//         const maker = req.params.maker?.toLowerCase();
//         if (!chainId) {
//             return res.status(400).send({ status: false, error: errorMessage.CHAIN_ID_REQUIRED })
//         }
//         if (!ethers.utils.isAddress(maker)) {
//             return res.status(400).send({ status: false, error: errorMessage.ADDRESS_REQUIRED_OR_INVALID })
//         }
//         const getUserPosition = await UserPosition.findOne({ chainId: chainId, id: maker }).lean();

//         let makerAddresses = [maker]
//         for (let i in getUserPosition?.position) {
//             makerAddresses.push(getUserPosition?.position[i])
//         };

//         const getAllPairs = await Pair.find({ chainId: chainId }).lean();
//         const aTokens: string[] = [];
//         const vTokens: string[] = [];
//         const tokens: string[] = [];
//         for (let ele of getAllPairs) {
//             aTokens.push(ele.atoken0, ele.atoken1);
//             vTokens.push(ele.vtoken0, ele.vtoken1);
//             tokens.push(ele.token0, ele.token1)
//         }

//         let result: any = { chainId, maker }
//         for (let i in aTokens) {
//             let res = await getPoolTokensMultiBalance(aTokens[i], vTokens[i], makerAddresses, chainId)! as any;

//             result[`${tokens[i]}`] = [res?.aTokenBalance?.toString(), res?.vTokenBalance.toString()]
//         }

//         return res.status(200).send({ status: true, data: result })
//     }
//     catch (error) {
//         console.log(`Error @ getUserPoolBalance`, error);
//     }
// }



// _getUserPoolBalance("421613", "0x103b62f68da23f20055c572269be67fa7635f2fc")

/**
 * @dev this function will provide makers all position balance correspondence to tokens available in perticular chainId
 * @param chainId: chainId is required 
 * @param maker: maker public key is required 
 * @returns it will return key and value pair, where key is the token, and value will be array of supply balance at 0 index, and borrow balance at 1 index
 */
export async function getUserPoolBalance(req: any, res: any) {
    try {
        // await connect()
        const chainId = req.query.chainId;
        const maker = req.params.maker?.toLowerCase();
        if (!chainId) {
            return res.status(400).send({ status: false, error: errorMessage.CHAIN_ID_REQUIRED })
        }
        if (!ethers.utils.isAddress(maker)) {
            return res.status(400).send({ status: false, error: errorMessage.ADDRESS_REQUIRED_OR_INVALID })
        }
        const getUserPosition = await UserPosition.findOne({ chainId: chainId, id: maker }).lean();

        let makerAddresses = [maker]
        for (let i in getUserPosition?.position) {
            makerAddresses.push(getUserPosition?.position[i])
        };

        const getAllPairs = await Pair.find({ chainId: chainId }).lean();
        const aTokens: string[] = [];
        const vTokens: string[] = [];
        const tokens: string[] = [];
        for (let ele of getAllPairs) {
            aTokens.push(ele.atoken0, ele.atoken1);
            vTokens.push(ele.vtoken0, ele.vtoken1);
            tokens.push(ele.token0, ele.token1)
        }

        let data: any = { chainId, maker }

        let result = await getPoolTokensMultiBalance(aTokens, vTokens, makerAddresses, chainId)! as any;
    
        for (let i = 0; i < result.dataAToken.length; i++) {
            data[`${tokens[i]}`] = [result?.dataAToken[i][1]?.toString(), result?.dataVToken[i][1]?.toString()]
        }

        return res.status(200).send({ status: true, data: data })
    }
    catch (error) {
        console.log(`Error @ getUserPoolBalance`, error);
    }
}