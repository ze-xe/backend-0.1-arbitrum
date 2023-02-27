
import { Order, OrderCreatedBackup } from "../DB/db";
import axios, { AxiosResponse } from "axios";
import { ExchangeConfig } from "../sync/configs/exchange";
import { historicEventListner } from "../sync/sync";
import mongoose from "mongoose";
import { startOrderStatus } from "../muticall/updateOrderStatus";
import { ifOrderCreated } from "../helper/interface";
import { socketService } from "../socketIo/socket.io";
import { getVersion } from "../helper/chain";
import * as sentry from "@sentry/node";
require("dotenv").config();


/**
 * @dev this function would check if there is any data in OrderCreated collection of main DB, if there is any data then it will  call historicEventListner and startOrderStatus. if there is no data in OrderCreated collection then it will search in backup collection and if there is any data then it will get signature and value and call order create api and call historicEventListner startOrderStatus functions.
 * @param {*} chainId (string) numeric chainId
 */
async function start(chainId: string, httpServer: any) {
    try {
        let getCreateRecords: ifOrderCreated[] = await Order.find();

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
                        token0Amount: copyOrder[i].token0Amount,
                        token1Amount: copyOrder[i].token1Amount,
                        leverage: copyOrder[i].leverage,
                        price: copyOrder[i].price,
                        expiry:copyOrder[i].expiry,
                        nonce: copyOrder[i].nonce,
                        action: copyOrder[i].action,
                        position: copyOrder[i].position
                    }

                    let result: AxiosResponse = await axios({
                        method: "post",
                        url: `http://localhost:3010/v/${getVersion(process.env.NODE_ENV!)}/order/create`,
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


export { start };
