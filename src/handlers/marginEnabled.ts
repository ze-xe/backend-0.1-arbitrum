import { Pair, Token } from "../DB/db";
import {  getABI, getProvider } from "../utils/utils";
import { ethers } from "ethers";
import { sentry } from "../../app";



export async function handleMarginEnabled(data: string[], argument: any) {
    try {
        
        let token: string = data[0].toLowerCase();
        let cToken = data[1].toLowerCase();
        let chainId = argument.chainId;
        const isTokenExist = await Token.findOne({ id: token, active: true }).lean();
        let symbol:string| undefined;

        if (isTokenExist) {
            if (isTokenExist.marginEnabled == true) {
                return
            }
            else if (isTokenExist.marginEnabled == false) {
                await Token.findOneAndUpdate({ id: token, active: true }, { $set: { marginEnabled: true, cId: cToken } });
                symbol = isTokenExist.symbol;
            }
        }

        if (!isTokenExist) {
            let provider = getProvider(chainId);
            let getTokenDetails = new ethers.Contract(token, getABI("TestERC20"), provider);
            let name = getTokenDetails["name"]();
            symbol = getTokenDetails["symbol"]();
            let decimals = getTokenDetails["decimals"]();
            let promise = await Promise.all([name, symbol, decimals]);
            name = promise[0];
            symbol = promise[1];
            decimals = promise[2];

            let temp = {
                id: token,
                name: name,
                symbol: symbol,
                decimals: decimals,
                price: "0",
                chainId: chainId,
                cId: cToken,
                marginEnabled: true
            };

            await Token.create(temp);

            console.log("Token Added from margin enable", token, chainId, symbol);
        }

        // creating pair
        let allToken = await Token.find({ marginEnabled: true, id: { $nin: [token] }, active: true }).lean();

        for (let i in allToken) {

            let isPairExist = await Pair.findOne({ token0: token, token1: allToken[i].id, active: true }).lean()

            if (isPairExist) {
               
                if (isPairExist.marginEnabled == false) {

                    await Pair.findOneAndUpdate(
                        { _id: isPairExist._id },
                        { $set: { marginEnabled: true } }
                    )
                    
                }
            }
            else {
                // checking opposite pair
                let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [allToken[i].id, token]);
                let id = ethers.utils.keccak256(encoder);

                let isPairExist = await Pair.findOne({ id: id, active: true }).lean();

                if (isPairExist) {

                    if (isPairExist.marginEnabled == false) {
                        await Pair.findOneAndUpdate(
                            { _id: isPairExist._id },
                            { $set: { marginEnabled: true } }
                        )
                        
                    }

                }

            }

        }

    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleMarginEnabled", error);
    }

}

