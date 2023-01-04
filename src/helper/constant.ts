
import { ethers } from "ethers";
import fs from "fs";
import { getERC20ABI, getExchangeABI, getProvider, leverageAbi } from "../utils";


const Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/deployments.json")).toString());


export const Decimals = {
    token: 18,
    amount: 18
};

export const contractName = Deployments["contracts"]["Exchange"]["constructorArguments"][0];
export const version = Deployments["contracts"]["Exchange"]["constructorArguments"][1];
export const ExchangeAddress = getContractAddress("Exchange").toLowerCase();
export const BtcAddress = getContractAddress("BTC").toLowerCase();
//export const BtcAddress = getContractAddress(""); // ethereum
export const UsdcAddress = getContractAddress("USDC").toLowerCase();
export const EthAddress = getContractAddress("ETH").toLowerCase();
export const leverAddress = getContractAddress("Lever").toLowerCase();
export const ZexeAddress = getContractAddress("ZEXE").toLowerCase();
export const cUsdcAddress = getContractAddress("lUSDC_Market").toLowerCase();
export const cBtcAddress = getContractAddress("lBTC_Market").toLowerCase();
export const LinkAddress = getContractAddress("LINK").toLowerCase();

function getContractAddress(name: string) {
    return Deployments["contracts"][name]["address"]
}

export function getContract(name: string) {
    let chainId = "421613"
    let provider = getProvider(chainId);
    let abi = getERC20ABI();

    if (name == "Exchange") {
        abi = getExchangeABI()
    }
    else if (name == "Lever"){
        abi = leverageAbi
    }

    return new ethers.Contract(getContractAddress(name), abi, provider)
}

// console.log(getContract("Exchange"))