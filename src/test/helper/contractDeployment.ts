
import fs from "fs";


const Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/deployments.json")).toString());


export const Decimals = {
    token: 18,
    amount: 18
};

export const name = Deployments["contracts"]["Exchange"]["constructorArguments"][1];
export const version = Deployments["contracts"]["Exchange"]["constructorArguments"][1];
export const ExchangeAddress: string = getContractAddress("Exchange");
export const BtcAddress = getContractAddress("BTC");// orignal
//export const BtcAddress = getContractAddress(""); // ethereum
export const UsdcAddress = getContractAddress("USDC");
export const EthAddress = getContractAddress("ETH");
export const leverAddress = getContractAddress("Lever");
export const ZexeAddress = getContractAddress("ZEXE");
export const cUsdcAddress = getContractAddress("lUSDC_Market");
export const cBtcAddress = getContractAddress("lBTC_Market");
export const LinkAddress = getContractAddress("LINK")

function getContractAddress(name: string) {
    return Deployments["contracts"][name]["address"]
}
