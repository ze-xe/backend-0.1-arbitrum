
import {ethers} from "ethers";
import Big from "big.js";
import { OrderCreated, OrderCreatedBackup } from "./db";
import axios, { AxiosResponse } from "axios";
import { ExchangeConfig } from "./sync/configs/exchange";
import { historicEventListner } from "./sync/sync";
import mongoose from "mongoose";
import { startOrderStatus } from "./sync/syncBalance";
import { ifOrderCreated} from "./helper/interface";
require("dotenv").config();


/**
 * @dev this function would check if there is any data in OrderCreated collection of main DB, if there is any data then it will  call historicEventListner and startOrderStatus. if there is no data in OrderCreated collection then it will search in backup collection and if there is any data then it will get signature and value and call order create api and call historicEventListner startOrderStatus functions.
 * @param {*} chainId (string) numeric chainId
 */
async function start(chainId: string) {
    try {
        let getCreateRecords : ifOrderCreated []= await OrderCreated.find();

        if (getCreateRecords.length == 0) {

            await mongoose.createConnection(process.env.MONGO_URL! as string).dropDatabase();

            let page: number = 0;

            let _limit: number = 20;
            await copy();
            async function copy() {
                console.log(page, "Page No");
                let copyOrder: ifOrderCreated[] = await OrderCreatedBackup.find({ chainId: chainId }, { _id: 0, __v: 0 }).skip(page * _limit).limit(20).lean();

                for (let i in copyOrder) {

                    let result: AxiosResponse = await axios({
                        method: "post",
                        url: "http://localhost:3010/order/create",
                        data: {
                            signature: copyOrder[i].signature,
                            chainId: copyOrder[i].chainId.toString(),
                            ipfs: true,
                            data: {
                                maker: copyOrder[i].maker,
                                token0: copyOrder[i].token0,
                                token1: copyOrder[i].token1,
                                amount: ethers.utils.parseEther(`${Big(copyOrder[i].amount).div(Big(10).pow(18))}`).toString(),
                                buy: copyOrder[i].buy,
                                salt: Number(copyOrder[i].salt),
                                exchangeRate: ethers.utils.parseEther(`${Big(copyOrder[i].exchangeRate).div(Big(10).pow(18))}`).toString(),

                            }
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
        historicEventListner(ExchangeConfig(chainId));
        startOrderStatus(chainId)
    }
    catch (error) {
        console.log("Error @ start", error);
    }
}


export { start };
