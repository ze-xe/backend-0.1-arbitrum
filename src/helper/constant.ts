
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { getABI, getProvider } from "../utils/utils";







export const Decimals = {
    token: 18,
    amount: 18
};

export function getConfig(name: any) {
    let Config = JSON.parse((fs.readFileSync(path.join(__dirname, '..', 'deployments', 'config.json'))).toString());
    return Config[name]
}


export function getContractAddress(name: string) {
    let Deployments = JSON.parse((fs.readFileSync(path.join(__dirname, '..', 'deployments', 'deployments.json'))).toString());
    return Deployments["contracts"][name]["address"].toLowerCase()
}


export function getContract(name: string, chainId: any) {

    let provider = getProvider(chainId);
    let abi = getABI("TestERC20");
    if (name == "Exchange") {
        abi = getABI("Exchange");
    }
    else if (name == "Lever") {
        abi = getABI("Lever");
    }
    return new ethers.Contract(getContractAddress(name), abi, provider)
}
