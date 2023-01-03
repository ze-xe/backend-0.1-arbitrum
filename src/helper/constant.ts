
import fs from "fs";


let Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/deployments/arbitrumGoerli/deployments.json")).toString());


export const Decimals = {
    token: 18,
    amount: 18
};



export let ExchangeAddress: string = getContractAddress("Exchange");
export let BtcAddress = getContractAddress("BTC");// orignal
// const BtcAddress = getContractAddress(""); // ethereum
export let UsdcAddress = getContractAddress("USDC");
export let EthAddress = getContractAddress("ETH");
export let leverAddress = getContractAddress("Lever");
export let ZexeAddress = getContractAddress("ZEXE");
export let cUsdcAddress = getContractAddress("lUSDC");
export let cBtcAddress = getContractAddress("lBTC");


function getContractAddress(name: string) {
    return Deployments["contracts"][name]["address"]
}
