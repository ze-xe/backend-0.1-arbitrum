import { Token } from "../db";
import { getERC20ABI, getProvider } from "../utils";
import { ethers } from "ethers";
import { sentry } from "../../app";



async function handleToken(token: string, chainId: string) {
    try {
        const isTokenExist = await Token.findOne({ id: token, active: true });

        if (isTokenExist) {
            return { symbol: isTokenExist.symbol, marginEnabled: isTokenExist.marginEnabled, minToken0Amount: isTokenExist.minTokenAmount };
        }

        let provider = getProvider(chainId);
        let getTokenDetails = new ethers.Contract(token, getERC20ABI(), provider);

        let name = getTokenDetails["name"]();
        let symbol = getTokenDetails["symbol"]();
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
            chainId: chainId
        };

        Token.create(temp);

        console.log("Token Added", token, chainId, symbol);
        return  { symbol: symbol, marginEnabled: false, minToken0Amount: "10000000000" }
    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ handleToken", error);
    }
}

export { handleToken };
