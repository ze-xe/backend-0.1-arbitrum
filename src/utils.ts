import fs from "fs";
import { ethers } from "ethers";
import Big from "big.js";
import { ExchangeAddress } from "./helper/constant";
import { getExchangeAddress, getRpcLink } from "./helper/chain";

const exchangeDeployments = JSON.parse((fs.readFileSync(process.cwd() + "/abi/Exchange.json")).toString());

const erc20Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/abi/ERC20.json")).toString());

const MulticallAbi = JSON.parse((fs.readFileSync(process.cwd() + "/abi/Multical.json")).toString());

export const leverageAbi = JSON.parse((fs.readFileSync(process.cwd() + "/abi/Leverage.json")).toString());

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


function validateMarginSignature(maker: string, signature: string, value: object, chainId: string): (string | null) {
    try {

        const domain = {
            name: "zexe",
            version: "1",
            chainId: chainId,
            verifyingContract: getExchangeAddress(chainId),
        };

        // The named list of all type definitions
        const types = {
            LeverageOrder: [
                { name: 'maker', type: 'address' },
                { name: 'token0', type: 'address' },
                { name: 'token1', type: 'address' },
                { name: 'amount', type: 'uint256' },
                { name: 'long', type: 'bool' },
                { name: 'salt', type: 'uint32' },
                { name: 'exchangeRate', type: 'uint176' },
                { name: 'borrowLimit', type: 'uint32' },
                { name: 'loops', type: 'uint8' }
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
            path: '/pair/allpairs?chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/pair/orders/0x5033779fbc17b2fb8a1378b6cdc6a1e4ea38628df3d4968dbee520e881c939b6?chainId=421613',
            params: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/pair/pricetrend/0x10ac6a9b21392578906a27c9ed1216bf20427366bac83f7dca1c2fb59ad5886d?chainId=421613&interval=300000',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/pair/trading/status/0x5033779fbc17b2fb8a1378b6cdc6a1e4ea38628df3d4968dbee520e881c939b6?chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/pair/orders/history/0xc351322540a6251965781613cc24d8fb44c06ce92e0ba675bbbbe4607c018b03?chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/user/orders/history/0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F/pair/0x5033779fbc17b2fb8a1378b6cdc6a1e4ea38628df3d4968dbee520e881c939b6?chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/user/orders/placed/0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F/pair/0xc351322540a6251965781613cc24d8fb44c06ce92e0ba675bbbbe4607c018b03?chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/user/orders/cancelled/0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F/pair/0x5033779fbc17b2fb8a1378b6cdc6a1e4ea38628df3d4968dbee520e881c939b6?chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/user/inorder/balance/0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F/token/0x0F8493e44430DF600F9Bf4132F55479D6FA9E314?chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/tokens?chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/chart/symbol?symbol=BTC_USDC',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/chart/bar/history/0x5033779fbc17b2fb8a1378b6cdc6a1e4ea38628df3d4968dbee520e881c939b6?from=1671533532&to=1671803532&interval=15&firstDataRequest=true',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/order/limit/matched/0x5033779fbc17b2fb8a1378b6cdc6a1e4ea38628df3d4968dbee520e881c939b6?amount=107340000000000000000&exchangeRate=18250000000000000000000&buy=true&chainId=421613',
            headers: {},
        },
        {
            protocol: 'http',
            host: 'localhost',
            port: 3010,
            path: '/order/market/matched/0x5033779fbc17b2fb8a1378b6cdc6a1e4ea38628df3d4968dbee520e881c939b6?amount=1959040260000000000000000&exchangeRate=18250000000000000000000&buy=true&chainId=421613',
            headers: {},
        },

    ],
    // ignoreStartsWith: '/pair'
}




export { getExchangeABI, getERC20ABI, validateSignature, parseEther, getInterface, getProvider, MulticallAbi, getDecimals, validateMarginSignature };