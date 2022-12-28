
import { OrderCreated, OrderCreatedBackup } from "./db";
import axios, { AxiosResponse } from "axios";
import { ExchangeConfig } from "./sync/configs/exchange";
import { historicEventListner } from "./sync/sync";
import mongoose from "mongoose";
import { startOrderStatus } from "./sync/syncBalance";
import { ifOrderCreated } from "./helper/interface";
import { socketService } from "./socketIo/socket.io";
import { httpServer, sentry } from "../app";
require("dotenv").config();


/**
 * @dev this function would check if there is any data in OrderCreated collection of main DB, if there is any data then it will  call historicEventListner and startOrderStatus. if there is no data in OrderCreated collection then it will search in backup collection and if there is any data then it will get signature and value and call order create api and call historicEventListner startOrderStatus functions.
 * @param {*} chainId (string) numeric chainId
 */
async function start(chainId: string) {
    try {
        let getCreateRecords: ifOrderCreated[] = await OrderCreated.find();

        if (getCreateRecords.length == 0) {

            await mongoose.createConnection(process.env.MONGO_URL! as string).dropDatabase();

            let page: number = 0;

            let _limit: number = 20;
            await copy();
            async function copy() {
                console.log(page, "Page No");
                let copyOrder: ifOrderCreated[] = await OrderCreatedBackup.find({ chainId: chainId }, { _id: 0, __v: 0 }).skip(page * _limit).limit(20).lean();

                for (let i in copyOrder) {

                    const input = {
                        maker: copyOrder[i].maker,
                        token0: copyOrder[i].token0,
                        token1: copyOrder[i].token1,
                        amount: copyOrder[i].amount,
                        orderType: copyOrder[i].orderType,
                        salt: Number(copyOrder[i].salt),
                        exchangeRate: copyOrder[i].exchangeRate,
                        borrowLimit: copyOrder[i].borrowLimit,
                        loops: copyOrder[i].loops
                    }

                    let result: AxiosResponse = await axios({
                        method: "post",
                        url: "http://localhost:3010/order/create",
                        data: {
                            signature: copyOrder[i].signature,
                            chainId: copyOrder[i].chainId.toString(),
                            ipfs: true,
                            data: input
                        }
                    });

                    console.log("backup Create Request", result.data);
                }
                page++;

                if (copyOrder.length > 0) {
                    await copy();
                }

            }
        }
        await historicEventListner(ExchangeConfig(chainId));
        socketService.init(httpServer)
        startOrderStatus(chainId)
    }
    catch (error) {
        sentry.captureException(error)
        console.log("Error @ start", error);
    }
}

// setTimeout(()=>{
//     setInterval(async ()=>{
//         let result: AxiosResponse = await axios({
//             method: "get",
//             url: "http://localhost:3010/pair/allpairs?chainId=421613",
//         });
//     },10)
// },10000)



export { start };
