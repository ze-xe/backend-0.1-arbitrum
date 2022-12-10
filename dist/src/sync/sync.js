"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.historicEventListner = exports.eventListner = void 0;
const db_1 = require("../db");
const ethers_1 = require("ethers");
const utils_1 = require("../utils");
require("dotenv").config();
/**
 * @dev this function is use to decode, encoded event logs
 * @param {*} data (string) from log
 * @param {*} topics (array)
 * @param {*} iface (interface)
 * @returns decode event data
 */
function decode_log_data(data, topics, iface) {
    try {
        const result = iface.parseLog({ data, topics });
        return result;
    }
    catch (error) {
        return;
    }
}
/**
 * @dev this function is use to listen current events and call the respective handler function with respective its events data, this fuction is called by historicEventListner() function
 * @notice sync current logs , call the handler fuction, store current block to DB.
 * @param {*}
 * @param {*} contractAddress (string) address of exchange
 * @param {*} abi (array of objects)
 * @param {*}  handlers (object) this will call respective handler function as per the event name
 * @param {*} chainId (string) numeric chainId
 */
function eventListner({ contractAddress, abi, handlers, chainId }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const provider = (0, utils_1.getProvider)(chainId);
            let Contract = new ethers_1.ethers.Contract(contractAddress, abi, provider);
            let events = Object.keys(handlers);
            let fromBlock = 0;
            for (let i = 0; i < events.length; i++) {
                Contract.on(events[i], (...args) => __awaiter(this, void 0, void 0, function* () {
                    let result = args[args.length - 1];
                    const blockTimestamp = (yield provider.getBlock(result.blockNumber)).timestamp * 1000;
                    fromBlock = result.blockNumber;
                    let argument = {
                        txnId: result.transactionHash,
                        blockTimestamp: blockTimestamp,
                        blockNumber: result.blockNumber,
                        address: result.address,
                        chainId: chainId,
                        logIndex: result.logIndex
                    };
                    // console.log(result)
                    yield handlers[events[i]](result.args, argument);
                    yield db_1.Sync.findOneAndUpdate({}, { blockNumberExchange: fromBlock }, { upsert: true });
                }));
            }
        }
        catch (error) {
            console.log("to sync");
            console.log("Error at eventListner", error);
            return historicEventListner({ contractAddress, abi, handlers, chainId });
        }
    });
}
exports.eventListner = eventListner;
/**
 * @dev this function is use to get historical log then decode that and call the respective handler function with decoded logs, if all logs synced then it will call the eventLisner function
 * @notice sync logs start from 0 if first time it is running, next time the last block will get from data base and then start sync from that block,
 * @param {*}
 * @param {*} contractAddress (string) address of exchange
 * @param {*} abi (array of objects)
 * @param {*}  handlers (object) this will call respective handler function as per the event name
 * @param {*} chainId (string) numeric chainId
 */
function historicEventListner({ contractAddress, abi, handlers, chainId }) {
    return __awaiter(this, void 0, void 0, function* () {
        eventSync();
        function eventSync() {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                let fromBlock = 0;
                try {
                    let syncDetails = yield db_1.Sync.findOne();
                    if (syncDetails) {
                        fromBlock = (_a = syncDetails.blockNumberExchange) !== null && _a !== void 0 ? _a : 0;
                    }
                    let provider = (0, utils_1.getProvider)(chainId);
                    let logs = yield provider.getLogs({ address: contractAddress, fromBlock: fromBlock });
                    let promiseTimestamp = [];
                    for (let i = 0; i < logs.length; i++) {
                        const blockTimestamp = (provider.getBlock(logs[i].blockNumber));
                        promiseTimestamp.push(blockTimestamp);
                    }
                    promiseTimestamp = yield Promise.all(promiseTimestamp);
                    for (let i in logs) {
                        let txnId = logs[i].transactionHash;
                        let blockNumber = logs[i].blockNumber;
                        fromBlock = logs[i].blockNumber;
                        let logIndex = logs[i].logIndex;
                        const blockTimestamp = promiseTimestamp[i].timestamp * 1000;
                        let argument = {
                            txnId: txnId,
                            blockNumber: blockNumber,
                            blockTimestamp: blockTimestamp,
                            address: logs[i].address,
                            chainId: chainId,
                            logIndex: logIndex
                        };
                        const iface = (0, utils_1.getInterface)(abi);
                        const decoded_data = yield decode_log_data(logs[i].data, logs[i].topics, iface);
                        if (decoded_data && decoded_data.args != undefined) {
                            // console.log(decoded_data)
                            if (handlers[decoded_data["name"]]) {
                                yield handlers[decoded_data["name"]](decoded_data.args, argument);
                            }
                        }
                    }
                    yield db_1.Sync.findOneAndUpdate({}, { blockNumberExchange: fromBlock }, { upsert: true });
                    console.log("to listen", contractAddress, chainId);
                    return eventListner({ contractAddress, abi, handlers, chainId });
                }
                catch (error) {
                    yield db_1.Sync.findOneAndUpdate({}, { blockNumberExchange: fromBlock }, { upsert: true });
                    console.log("Error @ historicEventListner", error);
                    return eventSync();
                }
            });
        }
    });
}
exports.historicEventListner = historicEventListner;
