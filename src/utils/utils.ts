import fs from "fs";
import { ethers } from "ethers";
import Big from "big.js";
import { getExchangeAddress, getRpcLink, getVersion } from "../helper/chain";
import { getConfig } from "../helper/constant";


const Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/deployments.json")).toString());


const MulticallAbi = JSON.parse((fs.readFileSync(process.cwd() + "/abi/Multical.json")).toString());


export const leverageAbi = Deployments["sources"]["Lever"];



function getExchangeABI() {
    return Deployments["sources"][`Exchange_${getConfig("latest")}`];
}
// console.log(getExchangeABI())

function getERC20ABI() {
    return Deployments["sources"]["TestERC20"];
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
        require("dotenv").config()
        const domain = {
            name: getConfig("name"),
            version: getVersion(process.env.NODE_ENV!),
            chainId: chainId,
            verifyingContract: getExchangeAddress(chainId),
        };

        // The named list of all type definitions
        const types = {
            Order: [
                { name: 'maker', type: 'address' },
                { name: 'token0', type: 'address' },
                { name: 'token1', type: 'address' },
                { name: 'amount', type: 'uint256' },
                { name: 'orderType', type: 'uint8' },
                { name: 'salt', type: 'uint32' },
                { name: 'exchangeRate', type: 'uint176' },
                { name: 'borrowLimit', type: 'uint32' },
                { name: 'loops', type: 'uint8' }
            ]
        };

        const digest: string = ethers.utils._TypedDataEncoder.hash(domain, types, value).toLowerCase();

        const signatureAddress: string = ethers.utils.recoverAddress(digest, signature).toLowerCase();
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


export const expressMonitorConfig = {

    title: 'Express Status',  // Default title
    theme: 'default.css',     // Default styles
    path: '/status',
    socketPath: '/socket.io', // In case you use a custom path
    // websocket: existingSocketIoInstance,
    spans: [{
        interval: 1,            // Every second
        retention: 60           // Keep 60 datapoints in memory
    }, {
        interval: 5,            // Every 5 seconds
        retention: 60
    }, {
        interval: 15,           // Every 15 seconds
        retention: 60
    }],
    chartVisibility: {
        cpu: true,
        mem: true,
        load: true,
        eventLoop: true,
        heap: true,
        responseTime: true,
        rps: true,
        statusCodes: true
    },
    healthChecks: [
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/DB/status',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/DB/fetch/record',
            headers: {},
        },

    ],
    // ignoreStartsWith: '/pair'
}




export { getExchangeABI, getERC20ABI, validateSignature, parseEther, getInterface, getProvider, MulticallAbi, getDecimals };