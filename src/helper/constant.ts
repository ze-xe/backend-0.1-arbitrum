
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { getERC20ABI, getExchangeABI, getProvider, leverageAbi } from "../utils/utils";







export const Decimals = {
    token: 18,
    amount: 18
};

export function getConfig(name: any) {
    // let Config = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/config.json")).toString());
    let Config = JSON.parse((fs.readFileSync(path.join(__dirname ,'..','deployments','config.json'))).toString());

    return Config[name]
}

// console.log(JSON.parse((fs.readFileSync(path.join(__dirname ,'..','deployments','deployments.json'))).toString()))
// console.log(getConfig("version"))


export function getContractAddress(name: string) {
    // let Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/deployments.json")).toString());
    let Deployments = JSON.parse((fs.readFileSync(path.join(__dirname ,'..','deployments','deployments.json'))).toString());
    return Deployments["contracts"][name]["address"].toLowerCase()
}

// console.log(getContractAddress("Exchange"))

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
