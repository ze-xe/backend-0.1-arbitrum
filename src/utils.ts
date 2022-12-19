import fs from "fs";
import { ethers } from "ethers";
import Big from "big.js";
import { ExchangeAddress } from "./helper/constant";
import { getExchangeAddress, getRpcLink } from "./helper/chain";

const exchangeDeployments = JSON.parse((fs.readFileSync(process.cwd() + "/abi/Exchange.json")).toString());

const erc20Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/abi/ERC20.json")).toString());

const MulticallAbi = JSON.parse((fs.readFileSync(process.cwd() + "/abi/Multical.json")).toString());



function getExchangeABI() {
    return exchangeDeployments["abi"];

}


function getERC20ABI() {
    return erc20Deployments["abi"];
}


function parseEther(value: number | string): string {

    return ethers.utils.parseEther(`${Big(value).div(Big(10).pow(18))}`).toString();
}

function getInterface(abi: object[]): ethers.utils.Interface {
    const iface = new ethers.utils.Interface(abi);
    return iface;
}

function getProvider(chainId: string): ethers.providers.JsonRpcProvider {
    const provider = new ethers.providers.JsonRpcProvider(getRpcLink(chainId));
    return provider;
}

/**
 * @dev This function would validate order signatures
 * @notice verify signature
 * @param {*} maker (string) should be order creator's address 
 * @param {*} signature (string)
 * @param {*} value (object)
 * @param {*} chainId (string) numeric chainId
 * @returns digest will be id of order, or false
 */
function validateSignature(maker: string, signature: string, value: object, chainId: string): (string | null) {
    try {

        const domain = {
            name: "zexe",
            version: "1",
            chainId: chainId,
            verifyingContract: getExchangeAddress(chainId),
        };

        // The named list of all type definitions
        const types = {
            Order: [
                { name: "maker", type: "address" },
                { name: "token0", type: "address" },
                { name: "token1", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "buy", type: "bool" },
                { name: "salt", type: "uint32" },
                { name: "exchangeRate", type: "uint216" }
            ],
        };

        const digest: string = ethers.utils._TypedDataEncoder.hash(domain, types, value);

        const signatureAddress: string = ethers.utils.recoverAddress(digest, signature);
        // console.log(maker, signatureAddress)
        if (maker == signatureAddress) {
            return digest;
        }

        return null;

    }
    catch (error: any) {
        console.log("Error @ validateSignature", error.message);
        return null
    }
}





function getDecimals(exchangeRate: string) {
    let findExchangeRateDecimals: string[] = [];
    let a = Big(exchangeRate).div(Big(10).pow(18)).toString().split(".");

    if (a.length > 1) {
        findExchangeRateDecimals = Big(exchangeRate).div(Big(10).pow(18)).toFixed(20).toString().split(".");
    }
    else {
        findExchangeRateDecimals = a;
    }

    let countInt = findExchangeRateDecimals[0].length;
    let exchangeRateDecimals;
    if (countInt >= 4) {
        exchangeRateDecimals = 2;
    }
    else if (countInt >= 1 && findExchangeRateDecimals[0] != '0') {
        exchangeRateDecimals = 3;
    }

    let count0 = 0;

    for (let i = 0; i < findExchangeRateDecimals[1]?.length ?? 0; i++) {
        if (findExchangeRateDecimals[1][i] == '0') {
            count0++;
        }
        else {
            break;
        }
    }

    let countDecInt = 0;

    for (let i = 0; i < findExchangeRateDecimals[1]?.length ?? 0; i++) {
        if (findExchangeRateDecimals[1][i] != '0') {
            countDecInt++;
        }
        else {
            break;
        }
    }

    if (exchangeRateDecimals && (count0 > exchangeRateDecimals || countDecInt > exchangeRateDecimals)) {

        return `only ${exchangeRateDecimals} decimal acceptable`;

    }
    else if (exchangeRateDecimals && count0 < exchangeRateDecimals && count0 < exchangeRateDecimals) {
        return exchangeRateDecimals;
    }
    else {
        exchangeRateDecimals = count0 + 4;
        for (let i = 0; i < findExchangeRateDecimals[1]?.length ?? 0; i++) {
            if (i <= exchangeRateDecimals - 1) {
                continue;
            }
            else if (findExchangeRateDecimals[1][i] != '0') {
                return `only ${exchangeRateDecimals} decimal acceptable`;
            }

        }
        return exchangeRateDecimals;
    }

}







export { getExchangeABI, getERC20ABI, validateSignature, parseEther, getInterface, getProvider, MulticallAbi, getDecimals };