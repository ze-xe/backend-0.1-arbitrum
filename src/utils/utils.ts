import fs from "fs";
import { ethers } from "ethers";
import Big from "big.js";
import {  getRpcLink} from "../helper/chain";
import { getConfig } from "../helper/constant";
import path from "path";
require("dotenv").config()


// if (process.env.NODE_ENV == "test") {
    // process.chdir('../')
// }
// const Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/deployments/deployments.json")).toString());
const Deployments = JSON.parse((fs.readFileSync(path.join(__dirname ,'..','deployments','deployments.json'))).toString());


export const MulticallAbi = Deployments["sources"]["Multicall2"];

// console.log(MulticallAbi)
export const leverageAbi = Deployments["sources"]["Lever"];



export function getExchangeABI() {
    return Deployments["sources"][`Exchange_${getConfig("latest")}`];
}
// console.log(getExchangeABI())

export function getERC20ABI() {
    return Deployments["sources"]["TestERC20"];
}

export function parseEther(value: number | string): string {

    return ethers.utils.parseEther(`${Big(value).div(Big(10).pow(18))}`).toString();
}

export function getInterface(abi: object[]): ethers.utils.Interface {
    const iface = new ethers.utils.Interface(abi);
    return iface;
}

export function getProvider(chainId: string): ethers.providers.JsonRpcProvider {
    const provider = new ethers.providers.JsonRpcProvider(getRpcLink(chainId));
    return provider;
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



