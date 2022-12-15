import { ExchangeAddress } from "./constant";



export function getRpcLink(chainId: string): string {

    let map: any = {
        "1666700000": "https://api.s0.b.hmny.io/",
        "421613": "https://arbitrum-goerli.infura.io/v3/bb621c9372d048979f8677ba78fe41d7",
        "1313161555": "https://testnet.aurora.dev"
    };

    return map[chainId];
}

export function getExchangeAddress(chainId: string): string {
    let map: any = {
        "421613": ExchangeAddress
    }

    return map[chainId]

}

export const MulticallAddress: any = {
    "1313161555": "0x266CCfe718EAac46ABF8589Dc8833f3A73a0Bd1c",
    "421613": "0x7dc45EEe67CE15a32ea4ea28e5b2392Ad20F5D6d"
};