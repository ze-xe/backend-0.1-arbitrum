
import fs from "fs";


const Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/deployments.json")).toString());


export const Decimals = {
    token: 18,
    amount: 18
};

export const contractName = Deployments["contracts"]["Exchange"]["constructorArguments"][0];
export const version = Deployments["contracts"]["Exchange"]["constructorArguments"][1];
export const ExchangeAddress = getContractAddress("Exchange");
export const BtcAddress = getContractAddress("BTC");// orignal
//export const BtcAddress = getContractAddress(""); // ethereum
export const UsdcAddress = getContractAddress("USDC");
export const EthAddress = getContractAddress("ETH");
export const leverAddress = getContractAddress("Lever");
export const ZexeAddress = getContractAddress("ZEXE");
export const cUsdcAddress = getContractAddress("lUSDC_Market");
export const cBtcAddress = getContractAddress("lBTC_Market");


function getContractAddress(name: string) {
    return Deployments["contracts"][name]["address"]
}
