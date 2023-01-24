
import { Sync } from "../DB/db";
import { ethers } from "ethers";
import { getInterface, getProvider } from "../utils/utils";
import { ifEventListner, ifSync } from "../helper/interface";
import * as sentry from "@sentry/node";
require("dotenv").config();



/**
 * @dev this function is use to decode, encoded event logs
 * @param {*} data (string) from log
 * @param {*} topics (array) 
 * @param {*} iface (interface)
 * @returns decode event data
 */
function decode_log_data(data: string, topics: string[], iface: any) {
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
async function eventListner({ contractAddress, abi, handlers, chainId }: ifEventListner) {
    try {

        const provider: ethers.providers.JsonRpcProvider = getProvider(chainId);
        let Contract: ethers.Contract = new ethers.Contract(contractAddress, abi, provider);
        let events: string[] = Object.keys(handlers);
        let fromBlock: number = 0;

        for (let i = 0; i < events.length; i++) {

            Contract.on(events[i], async (...args) => {
                let result = args[args.length - 1];
                const blockTimestamp: number = (await provider.getBlock(result.blockNumber)).timestamp * 1000;
                fromBlock = result.blockNumber;
                let argument = {
                    txnId: result.transactionHash,
                    blockTimestamp: blockTimestamp,
                    blockNumber: result.blockNumber,
                    address: result.address,
                    chainId: chainId,
                    logIndex: result.logIndex
                };
                // console.log(events[i])
                await handlers[events[i]](result.args, argument);

                await Sync.findOneAndUpdate(
                    { chainId: chainId },
                    { blockNumberExchange: fromBlock },
                    { upsert: true }
                );
            });
        }

    }
    catch (error) {

        console.log("to sync");
        console.log("Error at eventListner", error);
        // sentry.captureException(error)
        return historicEventListner({ contractAddress, abi, handlers, chainId });
    }

}


/**
 * @dev this function is use to get historical log then decode that and call the respective handler function with decoded logs, if all logs synced then it will call the eventLisner function
 * @notice sync logs start from 0 if first time it is running, next time the last block will get from data base and then start sync from that block, 
 * @param {*}
 * @param {*} contractAddress (string) address of exchange
 * @param {*} abi (array of objects)
 * @param {*}  handlers (object) this will call respective handler function as per the event name
 * @param {*} chainId (string) numeric chainId
 */

let errorCount = 0;
async function historicEventListner({ contractAddress, abi, handlers, chainId }: ifEventListner) {


    await eventSync();
    async function eventSync(): Promise<any> {
        let fromBlock: number = 0;
        try {

            let syncDetails: ifSync | null = await Sync.findOne({ chainId: chainId });

            if (syncDetails) {
                fromBlock = syncDetails.blockNumberExchange ?? 0;
            }

            let provider = getProvider(chainId);

            let logs: ethers.providers.Log[] = await provider.getLogs({ address: contractAddress, fromBlock: fromBlock });

            let promiseTimestamp: any = [];
            for (let i = 0; i < logs.length; i++) {
                const blockTimestamp = (provider.getBlock(logs[i].blockNumber));
                promiseTimestamp.push(blockTimestamp);
            }

            promiseTimestamp = await Promise.all(promiseTimestamp);
            for (let i in logs) {
                let txnId: string = logs[i].transactionHash;
                let blockNumber: number = logs[i].blockNumber;
                fromBlock = logs[i].blockNumber;
                let logIndex: number = logs[i].logIndex;
                const blockTimestamp: number = promiseTimestamp[i].timestamp * 1000;
                let argument = {
                    txnId: txnId,
                    blockNumber: blockNumber,
                    blockTimestamp: blockTimestamp,
                    address: logs[i].address,
                    chainId: chainId,
                    logIndex: logIndex
                };

                const iface: ethers.utils.Interface = getInterface(abi);
                const decoded_data: any = await decode_log_data(logs[i].data, logs[i].topics, iface);

                if (decoded_data && decoded_data.args != undefined) {
                    // console.log(decoded_data)
                    if (handlers[decoded_data["name"]]) {
                        await handlers[decoded_data["name"]](decoded_data.args, argument);
                    }
                }

            }
            await Sync.findOneAndUpdate(
                { chainId: chainId },
                { blockNumberExchange: fromBlock },
                { upsert: true }
            );


            console.log("to listen", contractAddress, chainId);
            return eventListner({ contractAddress, abi, handlers, chainId });
        }
        catch (error) {
            if (errorCount < 5) {
                await Sync.findOneAndUpdate(
                    {},
                    { blockNumberExchange: fromBlock },
                    { upsert: true }
                );
                sentry.captureException(error)
                console.log("Error @ historicEventListner", error);
                errorCount++
                return eventSync();

            }
            else {
                errorCount = 0;
                sentry.captureException(error)
            }
        }
    }


}



export { eventListner, historicEventListner };
