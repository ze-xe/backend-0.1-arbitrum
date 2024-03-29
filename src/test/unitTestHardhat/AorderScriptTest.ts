
import Big from "big.js";
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import hre from "hardhat";
import {  Order, OrderExecuted, Sync, User } from "../../DB/db";
import {  getVersion } from "../../helper/chain";
import { ifOrderCreated } from "../../helper/interface";
import {  parseEther } from "../../utils/utils";
import { io } from "socket.io-client";
import path from "path";
import { EVENT_NAME } from "../../socketIo/socket.io";
import {  } from "../../helper/constant";
import { deploy } from "../helper/contractDeploy";
import mongoose from "mongoose";
import { getTestConfig } from "../helper/addresses";
import { historicEventListner } from "../../sync/sync";
import { ExchangeConfig } from "../../sync/configs/exchange";

use(chaiHttp);
//@ts-ignore

const ethers = hre.ethers;
require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });

const socket = io("http://localhost:3010", { autoConnect: false });



let a = getVersion("test").split('.')
a.pop()
let _version = a.join("_")

describe("Limit Order Sell => Mint token, create order, execute order, cancel order", async () => {

    // requirements
    let chainId = "31337"
    let owner: any, user1: any, user2: any
    let usdc: any, btc: any, exchange: any, multicall: any
    let signatures: any[] = [];
    let orders: any[] = [];
    let exchangeRate = ethers.utils.parseEther('20000').toString();
    let orderId = "";
    let salt = Math.floor(Math.random() * 9000000);
    let amount = ethers.utils.parseEther('1').toString();
    let orderType = 1; // 1 for sell 0 for buy
    let btcAmount = ""
    let txnId = ""
    let userInOrderPre = '0';
    before(async () => {
        await require('../../../app');
        await mongoose.createConnection(process.env.MONGO_URL + `-backup-zexe-${_version}?retryWrites=true&w=majority`! as string).dropDatabase();
        await mongoose.createConnection(process.env.MONGO_URL1 + `-zexe-${_version}?retryWrites=true&w=majority`! as string).dropDatabase();
       
        [owner, user1, user2] = await ethers.getSigners();
        let deployment = await deploy(owner.address);
        usdc = deployment.usdc;
        btc = deployment.btc;
        exchange = deployment.exchange 
        console.log("Mulicall", deployment.multicall.address)
        console.log("Exchange", exchange.address)
        console.log("btc", btc.address)
        await historicEventListner(ExchangeConfig(chainId));
    });
    after(async () => {
        socket.disconnect()  
    })

    it('mint 10 btc to user1, 200000 usdt to user2, approve exchange contract', async () => {

        let user1BtcBalancePre = (await btc.balanceOf(user1.address)).toString();
        let user2UsdcBalancePre = (await usdc.balanceOf(user2.address)).toString();
        // mint btc
        let btcAmount = ethers.utils.parseEther('10').toString();
        let tx1 = await btc.connect(user1).mint(user1.address, btcAmount);
        await btc.connect(user2).mint(user2.address, btcAmount);

        // approve for exchange btc 
        let approve = await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
        await btc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256)

        // mint usdc
        const usdcAmount = ethers.utils.parseEther('200000').toString();
        let tx2 = await usdc.connect(user2).mint(user2.address, usdcAmount);
        await usdc.connect(user1).mint(user1.address, usdcAmount);

        // approve for exchange usdc
        let approve1 = await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);
        await usdc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
        await approve1.wait(1)
        // console.log(approve, approve1)
        console.log((await btc.allowance(user1.address, exchange.address)).toString());

        let user1BtcBalancePost = (await btc.balanceOf(user1.address)).toString();
        let user2UsdcBalancePost = (await usdc.balanceOf(user2.address)).toString();
        console.log("balance", user2UsdcBalancePost)
        expect(user1BtcBalancePost).to.equal(parseEther(Big(btcAmount).plus(user1BtcBalancePre).toString()));
        expect(user2UsdcBalancePost).to.equal(parseEther(Big(usdcAmount).plus(user2UsdcBalancePre).toString()));

    });


    it(`user1 creates limit order to sell 1 btc @ 20000, check user inOrder Balance`, async () => {
        console.log(hre.network.config.chainId, "chainID")
        const domain = {
            name: getTestConfig("name"),
            version: getVersion("test"),
            chainId: chainId.toString(),
            verifyingContract: exchange.address,
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

        // The data to sign
        const value = {
            maker: user1.address.toLowerCase(),
            token0: btc.address.toLowerCase(),
            token1: usdc.address.toLowerCase(),
            amount: amount,
            orderType: orderType,
            salt: salt,
            exchangeRate: exchangeRate,
            borrowLimit: 0,
            loops: 0
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

        let userPositionPre = await User.findOne({ token: btc.address.toLowerCase(), id: user1.address.toLowerCase() }).lean();

        let userInOrder = userPositionPre?.inOrderBalance ?? '0';

        let res = await request("http://localhost:3010")
            .post(`/v/${getVersion("test")}/order/create`)
            .send(
                {
                    "data": {
                        "maker": user1.address.toLowerCase(),
                        "token0": btc.address.toLowerCase(),
                        "token1": usdc.address.toLowerCase(),
                        "amount": amount,
                        "orderType": orderType,
                        "salt": salt,
                        "exchangeRate": exchangeRate,
                        borrowLimit: 0,
                        loops: 0
                    },
                    "signature": storedSignature.toLowerCase(),
                    "chainId": chainId,
                    // "ipfs": true,
                }
            );

        let userPositionPost = await User.findOne({ token: btc.address.toLowerCase(), id: user1.address.toLowerCase() }).lean()
        console.log(res.body)
        expect(res).to.have.status(201);
        expect(res.body.status).to.be.equal(true);
        expect(res.body).to.be.an('object');
        expect(res.body.message).to.have.string('Order created successfully');
        expect(userPositionPost).not.to.be.null;
        expect(userPositionPost?.inOrderBalance).to.equal(Big(userInOrder).plus(amount).toString())

    });

    it(`find created order in data base`, async () => {

        let data = await Order.findOne({ signature: signatures[0] }).lean()! as ifOrderCreated;
        expect(data).to.be.an('object');
        expect(data.amount).to.equal(amount);
        expect(data.maker).to.equal(user1.address.toLowerCase());
        orderId = data.id
    })


    it(`user2 buy user1s 0.8 btc order`, async () => {
        // balances
        let user1BtcBalancePre = btc.balanceOf(user1.address);
        let user2BtcBalancePre = btc.balanceOf(user2.address);
        let user2UsdcBalancePre = usdc.balanceOf(user2.address);
        let user1UsdcBalancePre = usdc.balanceOf(user1.address);
        let promise = await Promise.all([user1BtcBalancePre, user2BtcBalancePre, user2UsdcBalancePre, user1UsdcBalancePre])
        user1BtcBalancePre = promise[0].toString();
        user2BtcBalancePre = promise[1].toString()
        user2UsdcBalancePre = promise[2].toString()
        user1UsdcBalancePre = promise[3].toString()

        // inOrder Balance
        let userPositionPre = await User.findOne({ token: btc.address.toLowerCase(), id: user1.address.toLowerCase() }).lean();

        userInOrderPre = userPositionPre?.inOrderBalance ?? '0';

        btcAmount = ethers.utils.parseEther(`0.8`).toString();

        const exTxn = await exchange.connect(user2).executeT0LimitOrders(
            [signatures[0]],
            [orders[0]],
            btcAmount,
        );

        await exTxn.wait(1)
        let user1BtcBalancePost = btc.balanceOf(user1.address);
        let user1UsdcBalancePost = usdc.balanceOf(user1.address);
        let user2UsdcBalancePost = usdc.balanceOf(user2.address);
        let user2BtcBalancePost = btc.balanceOf(user2.address);

        let promise1 = await Promise.all([user1BtcBalancePost, user1UsdcBalancePost, user2UsdcBalancePost, user2BtcBalancePost]);
        user1BtcBalancePost = promise1[0].toString();
        user1UsdcBalancePost = promise1[1].toString();
        user2UsdcBalancePost = promise1[2].toString();
        user2BtcBalancePost = promise1[3].toString();

        let fee = await Sync.findOne().lean()! as any;
        let makerFeeAmount = Big(fee?.makerFee).div(1e18).times(btcAmount);
        let takerFeeAmount = Big(Big(fee.takerFee).div(1e18)).times(Big(btcAmount));

        expect(user1BtcBalancePost).to.equal(parseEther(Big(user1BtcBalancePre).minus(btcAmount).toString()));
        expect(user1UsdcBalancePost).to.equal(parseEther(
            Big(user1UsdcBalancePre)
                .plus((Big(btcAmount)
                    .minus(makerFeeAmount))
                    .times(exchangeRate)
                    .div(Big(10).pow(18))).toString()
        ));
        expect(user2BtcBalancePost).to.equal(parseEther(Big(user2BtcBalancePre).plus(Big(btcAmount).minus(takerFeeAmount)).toString()))
        expect(user2UsdcBalancePost).to.equal(parseEther(
            Big(user2UsdcBalancePre)
                .minus(Big(btcAmount)
                    .times(exchangeRate)
                    .div(Big(10).pow(18))).toString()
        ));


        let wait = () => {
            return new Promise((resolve, reject) => {

                let timeOutId = setTimeout(() => {
                    return resolve("Success")
                }, 7000)
            })
        }

        let res = await wait()
        expect(res).to.equal("Success")

        await exTxn.wait(1).then(async (resp: any) => {

            txnId = resp.transactionHash

        })
    });


    it(`find executed Order, check inOrderBalance`, async () => {
        // console.log("txnId=",txnId, "orderId", orderId)
        let executeOrder = await OrderExecuted.findOne({ id: orderId }).lean();
        let userPosition = await User.findOne({ id: user1.address.toLowerCase(), token: btc.address.toLowerCase() }).lean()! as any;
        let orderCreated = await Order.findOne({ id: orderId }).lean()! as any;

        expect(orderCreated?.balanceAmount).to.equal(Big(orderCreated.amount).minus(btcAmount).toString())
        expect(executeOrder).not.to.be.null;
        expect(executeOrder?.fillAmount).to.equal(btcAmount);
        expect(executeOrder?.exchangeRate).to.equal(exchangeRate);
        expect(userPosition).not.to.be.null;
        expect(userPosition?.inOrderBalance).to.equal(Big(userInOrderPre).minus(btcAmount).toString())
        let wait = () => {
            return new Promise((resolve, reject) => {

                let timeOutId = setTimeout(() => {
                    return resolve("Success")
                }, 7000)
            })
        }
        let res = await wait()
    })




    it(`user1 cancel order 0.2 btc, check order, inOrderbalance `, async () => {

        let userPositionPre = await User.findOne({ id: user1.address.toLowerCase(), token: btc.address.toLowerCase() }).lean()

        let exTxn = await exchange.connect(user1).cancelOrder(
            signatures[0],
            orders[0],
        )

        await exTxn.wait(1);

        let wait = () => {
            return new Promise((resolve, reject) => {

                let timeOutId = setTimeout(() => {
                    return resolve("Success")
                }, 7000)

                socket.on(EVENT_NAME.CANCEL_ORDER, (data) => {
                    clearTimeout(timeOutId)
                    return resolve("Success")
                })
            })
        }
        let res = await wait()
        expect(res).to.equal("Success")
        let order = await Order.findOne({ id: orderId }).lean();
        let userPositionPost = await User.findOne({ id: user1.address.toLowerCase(), token: btc.address.toLowerCase() }).lean()
        expect(order).to.be.an('object');
        expect(order?.cancelled).to.equal(true);
        expect(userPositionPost).to.be.an('object');
        expect(userPositionPost?.inOrderBalance).to.equal(Big(userPositionPre?.inOrderBalance! as string).minus(Big(amount).minus(btcAmount)).toString());


    })


});





