import fs from "fs";
import { ethers } from "ethers";
import Big from "big.js";
import { getRpcLink} from "../helper/chain";
import { getConfig } from "../helper/constant";
import path from "path";




export function getABI(name: any) {
    const Deployments = JSON.parse((fs.readFileSync(path.join(__dirname, '..', 'deployments', 'deployments.json'))).toString())["sources"];
    let abis = ["Lever", "TestERC20","Multicall2"]
    if (name == "Exchange") {
        return Deployments[`Exchange_${getConfig("latest")}`];
    }
    else if (abis.includes(name)) {
        return Deployments[name]
    }  
    console.log(`request not valid`)
    return []
}

export function parseEther(value: number | string): string {

    return ethers.utils.parseEther(`${Big(value).div(Big(10).pow(18))}`).toString();
}

export function getInterface(abi: object[]): ethers.utils.Interface {
    const iface = new ethers.utils.Interface(abi);
    return iface;
}

export function getProvider(chainId: string): ethers.providers.JsonRpcProvider {
    const provider = new ethers.providers.JsonRpcProvider(getRpcLink(chainId));
    return provider;
}







