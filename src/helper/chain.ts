import { getTestConfig, getTestContractAddress, } from "../test/helper/addresses";
import { getConfig, getContractAddress } from "./constant";



export function getRpcLink(chainId: string): string {

    let map: any = {
        "1666700000": "https://api.s0.b.hmny.io/",
        // "421613": "https://arbitrum-goerli.infura.io/v3/bb621c9372d048979f8677ba78fe41d7",
        // "421613": "https://nd-389-970-162.p2pify.com/17b0fbe8312c9ff963057d537b9c7864",
        "421613": "https://arb-goerli.g.alchemy.com/v2/HyNaane88yHFsK8Yrn4gf2OOzHkd6GAJ",
        "1313161555": "https://testnet.aurora.dev",
        "31337": "http://localhost:8545"
    };

    return map[chainId];
}

export function getExchangeAddress(chainId: string): string {
    let map: any = {
        "421613": getContractAddress("Exchange"),
        "31337": getTestContractAddress("Exchange")
    }

    return map[chainId]
}

export function getVersion(env: string): string {
    let map: any = {
        "dev": getConfig("version"),
        "test": getTestConfig("version")
    }
    return map[env]
}

// console.log(getVersion("dev"))

export function getLeverAddress(chainId: string) {
    let map: any = {
        "421613": getContractAddress("Lever"),
        "31337": getTestContractAddress("Lever")
    }

    return map[chainId]
}

// console.log(getExchangeAddress("421613"))

export const MulticallAddress: any = {
    "1313161555": "0x266CCfe718EAac46ABF8589Dc8833f3A73a0Bd1c",
    "421613": getContractAddress("Multicall2"),
    "31337": getTestContractAddress("Multicall2")
};
// console.log(getContractAddress("Multicall2"))