
import Big from "big.js";
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import { ethers } from "ethers";
import mongoose from "mongoose";
import { httpServer } from "../../../app";
import { connect, OrderCreated, OrderExecuted, Sync, UserPosition } from "../../db";
import { getExchangeAddress, getVersion } from "../../helper/chain";
import { getERC20ABI, getExchangeABI, getProvider, parseEther } from "../../utils/utils";
import { io } from "socket.io-client";
import path from "path";
import { EVENT_NAME } from "../../socketIo/socket.io";
import { getConfig, getContract, } from "../../helper/constant";
import { ifOrderCreated } from "../../helper/interface";
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
    let exchange = getContract("Exchange", chainId);
    let btc = getContract("BTC", chainId)
    let usdc = getContract("USDC", chainId)
    let user1 = new ethers.Wallet(process.env.PRIVATE_KEY1! as string).connect(provider); //2
        let user2 = new ethers.Wallet(process.env.PRIVATE_KEY2! as string).connect(provider); //1
    let signatures: any[] = [];
    let orders: any[] = [];
    let exchangeRate = ethers.utils.parseEther('20000').toString();
    let txnId = "";
    let orderId = "";
    let salt = Math.floor(Math.random() * 9000000);
    let amount = ethers.utils.parseEther('1').toString();
    let orderType = 1; // 1 for sell 0 for buy
    let btcAmount = ""
    let userInOrderPre = '0';
    before(async () => { //Before each test we empty the database   
        // await mongoose.createConnection(process.env.MONGO_URL! as string).dropDatabase();
        // httpServer
        await connect()
    });
/*
    it('mint 10 btc to user1, 200000 usdt to user2, approve exchange contract', async () => {

        let user1BtcBalancePre = (await btc.balanceOf(user1.address)).toString();
        let user2UsdcBalancePre = (await usdc.balanceOf(user2.address)).toString();

        const btcAmount = ethers.utils.parseEther('10').toString();
        let tx1 = await btc.connect(user1).mint(user1.address, btcAmount, { gasLimit: "100000000" });

        // approve for exchange
        let approve = await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256, { gasLimit: "100000000" });
        await btc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256,{ gasLimit: "100000000" })

        const usdcAmount = ethers.utils.parseEther('200000').toString();
        let tx2 = await usdc.connect(user2).mint(user2.address, usdcAmount, { gasLimit: "100000000" });

        // approve for exchange
        let approve1 = await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256, { gasLimit: "100000000" });
        await usdc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256, { gasLimit: "100000000" });
        await approve1.wait(1)
        let user1BtcBalancePost = (await btc.balanceOf(user1.address)).toString();
        let user2UsdcBalancePost = (await usdc.balanceOf(user2.address)).toString();

        expect(user1BtcBalancePost).to.equal(parseEther(Big(btcAmount).plus(user1BtcBalancePre).toString()));
        expect(user2UsdcBalancePost).to.equal(parseEther(Big(usdcAmount).plus(user2UsdcBalancePre).toString()));


    });

*/
    it(`user1 creates limit order to sell 1 btc @ 20000, check user inOrder Balance`, async () => {

        const domain = {
            name: getConfig("name"),
            version: getVersion(process.env.NODE_ENV!),
            chainId: chainId.toString(),
            verifyingContract: getExchangeAddress(chainId),
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

        let userPositionPre = await UserPosition.findOne({ token: btc.address.toLowerCase(), id: user1.address.toLowerCase() }).lean();

        let userInOrder = userPositionPre?.inOrderBalance ?? '0';

        let res = await request("http://localhost:3010")
            .post(`/v/${getVersion(process.env.NODE_ENV!)}/order/create`)
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
                    "chainId": chainId
                }
            );

        let userPositionPost = await UserPosition.findOne({ token: btc.address.toLowerCase(), id: user1.address.toLowerCase() }).lean()
        // console.log(res)
        expect(res).to.have.status(201);
        expect(res.body.status).to.be.equal(true);
        expect(res.body).to.be.an('object');
        expect(res.body.message).to.have.string('Order created successfully');
        expect(userPositionPost).not.to.be.null;
        expect(userPositionPost?.inOrderBalance).to.equal(Big(userInOrder).plus(amount).toString())

    });

    it(`find created order in data base`, async () => {

        let data = await OrderCreated.findOne({ signature: signatures[0] }).lean()! as ifOrderCreated;
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
        let userPositionPre = await UserPosition.findOne({ token: btc.address.toLowerCase(), id: user1.address.toLowerCase() }).lean();

        userInOrderPre = userPositionPre?.inOrderBalance ?? '0';

        btcAmount = ethers.utils.parseEther(`0.8`).toString();

        const exTxn = await exchange.connect(user2).executeT0LimitOrders(
            [signatures[0]],
            [orders[0]],
            btcAmount,
            { gasLimit: "100000000" }
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
                }, 15000)

                socket.on(EVENT_NAME.PAIR_HISTORY, (data) => {
                    clearTimeout(timeOutId)
                    return resolve("Success")
                })
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
        let userPosition = await UserPosition.findOne({ id: user1.address.toLowerCase(), token: btc.address.toLowerCase() }).lean()! as any;
        let orderCreated = await OrderCreated.findOne({ id: orderId }).lean()! as any;

        expect(orderCreated?.balanceAmount).to.equal(Big(orderCreated.amount).minus(btcAmount).toString())
        expect(executeOrder).not.to.be.null;
        expect(executeOrder?.fillAmount).to.equal(btcAmount);
        expect(executeOrder?.exchangeRate).to.equal(exchangeRate);
        expect(userPosition).not.to.be.null;
        expect(userPosition?.inOrderBalance).to.equal(Big(userInOrderPre).minus(btcAmount).toString())

    })




    it(`user1 cancell order 0.2 btc, check order, inOrderbalance `, async () => {

        let userPositionPre = await UserPosition.findOne({ id: user1.address.toLowerCase(), token: btc.address.toLowerCase() }).lean()

        let exTxn = await exchange.connect(user1).cancelOrder(
            signatures[0],
            orders[0],
            { gasLimit: "100000000" }
        )

        await exTxn.wait(1);

        let wait = () => {
            return new Promise((resolve, reject) => {

                let timeOutId = setTimeout(() => {
                    return resolve("Success")
                }, 15000)

                socket.on(EVENT_NAME.CANCEL_ORDER, (data) => {
                    clearTimeout(timeOutId)
                    return resolve("Success")
                })
            })
        }
        let res = await wait()
        expect(res).to.equal("Success")
        let order = await OrderCreated.findOne({ id: orderId }).lean();
        let userPositionPost = await UserPosition.findOne({ id: user1.address.toLowerCase(), token: btc.address.toLowerCase() }).lean()
        expect(order).to.be.an('object');
        expect(order?.cancelled).to.equal(true);
        expect(userPositionPost).to.be.an('object');
        expect(userPositionPost?.inOrderBalance).to.equal(Big(userPositionPre?.inOrderBalance! as string).minus(Big(amount).minus(btcAmount)).toString());


    })

    // it(`it will get events`,(done)=>{

    //     socket.on(EVENT_NAME.PAIR_HISTORY, (data) => {

    //         expect(data).not.to.be.null;

    //     })
    //     socket.on(EVENT_NAME.PAIR_ORDER, (data) => {

    //         expect(data).not.to.be.null;
    //         done()
    //     })

    // })




});





