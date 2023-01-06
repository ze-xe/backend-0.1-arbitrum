










import Big from "big.js";
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import { ethers } from "ethers";
import mongoose from "mongoose";
import { httpServer } from "../../../app";
import { connect, OrderCreated, OrderExecuted, Sync, UserPosition } from "../../db";
import { getExchangeAddress } from "../../helper/chain";
import { BtcAddress, ExchangeAddress, UsdcAddress } from "../helper/contractDeployment";
import { ifOrderCreated } from "../../helper/interface";
import { getERC20ABI, getExchangeABI, getProvider, parseEther } from "../../utils/utils";
import { io } from "socket.io-client";
import path from "path";
import { EVENT_NAME } from "../../socketIo/socket.io";
import { contractName, getContract, LinkAddress, version } from "../../helper/constant";
use(chaiHttp);
require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });
const socket = io("https://api.zexe.io");


socket.on(EVENT_NAME.PAIR_ORDER, (data) => {
    console.log("pairOrders", data)
});

socket.on(EVENT_NAME.PAIR_HISTORY, (data) => {
    console.log("pairHistory", data)
})

describe("Limit Order => Mint token, create order, execute order, cancel order", async () => {

    // requirements
    let chainId = "421613"
    let provider = getProvider(chainId);
    let user1 = new ethers.Wallet(process.env.PRIVATE_KEY1! as string).connect(provider); //1 
    let signatures: any[] = [];
    let orders: any[] = [];
    const blackList = 0 // for add in blackList, 1 for remove from blackList.
    before(async () => { //Before each test we empty the database   
        await connect()
    });


    it(`user1 creates limit order to sell 1 btc @ 20000, check user inOrder Balance`, async () => {

        const domain = {
            name: contractName,
            version: version,
            chainId: chainId.toString(),
            verifyingContract: getExchangeAddress(chainId),
        };

        // The named list of all type definitions
        const types = {
            Request: [
                { name: 'token', type: 'address' },
                { name: 'blackList', type: 'uint8' },
            ]
        };

        // The data to sign
        const value = {
            token: LinkAddress,
            blackList: blackList
        };

        orders.push(value);
        // sign typed data
        const storedSignature = await user1._signTypedData(
            domain,
            types,
            value
        );
        signatures.push(storedSignature);
        console.log([
            value, storedSignature
        ]);

        let res = await request("http://localhost:3010")
            .put(`/v/${version}/pair/blacklist `)
            .send(
                {
                    "token": LinkAddress,
                    "blackList": blackList,
                    "signature": storedSignature.toLowerCase(),
                    "chainId": chainId
                }
            );

       
        // console.log(res)
        expect(res).to.have.status(200);
        expect(res.body.status).to.be.equal(true);
        expect(res.body).to.be.an('object');
        // expect(res.body.message).to.have.string('Order created successfully');

    });




});





