import fs from "fs";
import { ethers } from "ethers";
import Big from "big.js";
import { getRpcLink } from "../helper/chain";
import { getConfig } from "../helper/constant";
import path from "path";




export function getABI(name: any) {
    const Deployments = JSON.parse((fs.readFileSync(path.join(__dirname, '..', 'deployments', 'deployments.json'))).toString())["sources"];
    let abis = ["Lever", "TestERC20", "Multicall2", "Spot", "MockToken", "IPool", "AToken", "VToken", "AaveOracle", "PoolAddressesProvider"]
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

    return ethers.utils.parseEther(`${Big(value).div(1e18)}`).toString();
}

export function getInterface(abi: object[]): ethers.utils.Interface {
    const iface = new ethers.utils.Interface(abi);
    return iface;
}

export function getProvider(chainId: string): ethers.providers.JsonRpcProvider {
    const provider = new ethers.providers.JsonRpcProvider(getRpcLink(chainId));
    return provider;
}

export function getspotAddress(chainId: string): string[] {
    let spot = JSON.parse(fs.readFileSync(path.join(__dirname+"../../zexe.config.json" )).toString())[chainId];

    return Object.keys(spot);
}

// console.log(getspotAddress("421613"))









