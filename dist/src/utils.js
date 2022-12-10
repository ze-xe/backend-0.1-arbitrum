"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MulticallAbi = exports.getProvider = exports.getInterface = exports.parseEther = exports.getRpcLink = exports.validateSignature = exports.getERC20ABI = exports.getExchangeAddress = exports.getExchangeABI = void 0;
const fs_1 = __importDefault(require("fs"));
const ethers_1 = require("ethers");
const big_js_1 = __importDefault(require("big.js"));
const constant_1 = require("./helper/constant");
const exchangeDeployments = JSON.parse((fs_1.default.readFileSync(process.cwd() + "/abi/Exchange.json")).toString());
const erc20Deployments = JSON.parse((fs_1.default.readFileSync(process.cwd() + "/abi/ERC20.json")).toString());
const MulticallAbi = JSON.parse((fs_1.default.readFileSync(process.cwd() + "/abi/Multical.json")).toString());
exports.MulticallAbi = MulticallAbi;
function getExchangeABI() {
    return exchangeDeployments["abi"];
}
exports.getExchangeABI = getExchangeABI;
function getERC20ABI() {
    return erc20Deployments["abi"];
}
exports.getERC20ABI = getERC20ABI;
function parseEther(value) {
    return ethers_1.ethers.utils.parseEther(`${(0, big_js_1.default)(value).div((0, big_js_1.default)(10).pow(18))}`).toString();
}
exports.parseEther = parseEther;
function getInterface(abi) {
    const iface = new ethers_1.ethers.utils.Interface(abi);
    return iface;
}
exports.getInterface = getInterface;
function getProvider(chainId) {
    const provider = new ethers_1.ethers.providers.JsonRpcProvider(getRpcLink(chainId));
    return provider;
}
exports.getProvider = getProvider;
/**
 * @dev This function would validate order signatures
 * @notice verify signature
 * @param {*} maker (string) should be order creator's address
 * @param {*} signature (string)
 * @param {*} value (object)
 * @param {*} chainId (string) numeric chainId
 * @returns digest will be id of order, or false
 */
function validateSignature(maker, signature, value, chainId) {
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
        const digest = ethers_1.ethers.utils._TypedDataEncoder.hash(domain, types, value);
        const signatureAddress = ethers_1.ethers.utils.recoverAddress(digest, signature);
        // console.log(maker, signatureAddress)
        if (maker == signatureAddress) {
            return digest;
        }
        return null;
    }
    catch (error) {
        console.log("Error @ validateSignature", error.message);
        return null;
    }
}
exports.validateSignature = validateSignature;
// function getDecimals(exchangeRate: string) {
//     let findExchangeRateDecimals;
//     let a = Big(exchangeRate).div(Big(10).pow(18)).toString().split(".");
//     if (a.length > 1) {
//         findExchangeRateDecimals = Big(exchangeRate).div(Big(10).pow(18)).toFixed(20).toString().split(".");
//     }
//     else {
//         findExchangeRateDecimals = a;
//     }
//     let countInt = findExchangeRateDecimals[0].length;
//     let exchangeRateDecimals;
//     if (countInt >= 4) {
//         exchangeRateDecimals = 2;
//     }
//     else if (countInt >= 1 && findExchangeRateDecimals[0] != '0') {
//         exchangeRateDecimals = 3;
//     }
//     let count0 = 0;
//     for (let i = 0;  i<findExchangeRateDecimals[1].length; i++) {
//         if (findExchangeRateDecimals[1][i] == '0') {
//             count0++;
//         }
//         else {
//             break;
//         }
//     }
//     let countDecInt = 0;
//     for (let i = 0;  i<findExchangeRateDecimals[1].length; i++) {
//         if (findExchangeRateDecimals[1][i] != '0') {
//             countDecInt++;
//         }
//         else {
//             break;
//         }
//     }
//     if (exchangeRateDecimals && (count0 > exchangeRateDecimals || countDecInt > exchangeRateDecimals)) {
//         return `only ${exchangeRateDecimals} decimal acceptable`;
//     }
//     else if (exchangeRateDecimals && count0 < exchangeRateDecimals && count0 < exchangeRateDecimals) {
//         return exchangeRateDecimals;
//     }
//     else {
//         exchangeRateDecimals = count0 + 4;
//         for (let i = 0;  i<findExchangeRateDecimals[1].length; i++) {
//             if (i <= exchangeRateDecimals - 1) {
//                 continue;
//             }
//             else if (findExchangeRateDecimals[1][i] != '0') {
//                 return `only ${exchangeRateDecimals} decimal acceptable`;
//             }
//         }
//         return exchangeRateDecimals;
//     }
// }
function getRpcLink(chainId) {
    let map = {
        "1666700000": "https://api.s0.b.hmny.io/",
        "421613": "https://arbitrum-goerli.infura.io/v3/bb621c9372d048979f8677ba78fe41d7"
    };
    return map[chainId];
}
exports.getRpcLink = getRpcLink;
function getExchangeAddress(chainId) {
    let map = {
        "421613": constant_1.ExchangeAddress
    };
    return map[chainId];
}
exports.getExchangeAddress = getExchangeAddress;
