
import { ethers } from "ethers";
import fs from "fs";
import { getERC20ABI, getExchangeABI, getProvider, leverageAbi } from "../utils/utils";







export const Decimals = {
    token: 18,
    amount: 18
};

export function getConfig(name: any) {
    let Config = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/config.json")).toString());
    return Config[name]
}


// export const ExchangeAddress = getContractAddress("Exchange").toLowerCase();
// export const BtcAddress = getContractAddress("BTC").toLowerCase();
// //export const BtcAddress = getContractAddress(""); // ethereum
// export const UsdcAddress = getContractAddress("USDC").toLowerCase();
// export const EthAddress = getContractAddress("ETH").toLowerCase();
// export const leverAddress = getContractAddress("Lever").toLowerCase();
// export const ZexeAddress = getContractAddress("ZEXE").toLowerCase();
// export const cUsdcAddress = getContractAddress("lUSDC_Market").toLowerCase();
// export const cBtcAddress = getContractAddress("lBTC_Market").toLowerCase();
// export const LinkAddress = getContractAddress("LINK").toLowerCase();
// export const multicallAddress = getContractAddress("Multicall2").toLowerCase()


export function getContractAddress(name: string) {
    let Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/deployments.json")).toString());
    return Deployments["contracts"][name]["address"].toLowerCase()
}

console.log(getContractAddress("Exchange"))

export function getContract(name: string, chainId: any) {

    let provider = getProvider(chainId);
    let abi = getERC20ABI();

    if (name == "Exchange") {
        abi = getExchangeABI()
    }
    else if (name == "Lever") {
        abi = leverageAbi
    }

    return new ethers.Contract(getContractAddress(name), abi, provider)
}
