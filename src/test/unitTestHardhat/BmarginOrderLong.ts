
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
use(chaiHttp);
import Big from "big.js";
import { EVENT_NAME } from "../../socketIo/socket.io";
import { getProvider, parseEther } from "../../utils/utils";
import { getExchangeAddress, getVersion } from "../../helper/chain";
import { io } from "socket.io-client";
import path from "path";
import { Order, Sync } from "../../DB/db";
import { ifOrderCreated } from "../../helper/interface";
import { getConfig } from "../../helper/constant";
import { deploy } from "../helper/contractDeploy";
import { historicEventListner } from "../../sync/sync";
import { ExchangeConfig } from "../../sync/configs/exchange";
import hre from "hardhat";



//@ts-ignore
const ethers = hre.ethers;


require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });

let a = getVersion("test").split('.')
a.pop()
let _version = a.join("_")

const socket = io("http://localhost:3010", { autoConnect: false });

describe("Margin Order Long => Mint token, create order, execute order, cancel order", async () => {

    // requirements

    let chainId = "31337"
    let owner: any, user1: any, user2: any
    let usdc: any, btc: any, exchange: any, multicall: any, lever: any, cUsdc: any, cBtc: any
    let provider = getProvider(chainId);

    let signatures: any[] = [];
    let orders: any[] = [];
    let orderCreated: any[] = []
    let exchangeRate = ethers.utils.parseEther('20000').toString();

    let salt = Math.floor(Math.random() * 9000000);
    let amount = ethers.utils.parseEther('1').toString();
    let loops = 5;
    let orderType = 2 // long

    before(async () => {
        [owner, user1, user2] = await ethers.getSigners();
        let deployment = await deploy(owner.address);
        usdc = deployment.usdc;
        btc = deployment.btc;
        lever = deployment.lever;
        cUsdc = deployment.cusdc;
        cBtc = deployment.cbtc;
        exchange = deployment.exchange
        await historicEventListner(ExchangeConfig(chainId));

    });

    after(async () => {
        socket.disconnect()
        
        
    })

    it('mint 10 btc to user1, 10 btc to user2, approve exchange contract', async () => {

        let user1BtcBalancePre = (await btc.balanceOf(user1.address)).toString();
        let user2BtcBalancePre = (await btc.balanceOf(user2.address)).toString();
        // mint btc
        const btcAmount = ethers.utils.parseEther('10').toString();
        let tx1 = await btc.connect(user1).mint(user1.address, btcAmount);
        await btc.connect(user2).mint(user2.address, btcAmount);

        // approve for exchange btc 
        let approve = await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
        await btc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256)

        let approve1 = await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);
        await usdc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
        await approve1.wait(1)

        let user1BtcBalancePost = (await btc.balanceOf(user1.address)).toString();
        let user2BtcBalancePost = (await btc.balanceOf(user2.address)).toString();
        // console.log("balance", user2UsdcBalancePost)

        expect(user1BtcBalancePost).to.equal(parseEther(Big(btcAmount).plus(user1BtcBalancePre).toString()));
        expect(user2BtcBalancePost).to.equal(parseEther(Big(btcAmount).plus(user2BtcBalancePre).toString()));

    });
    it("make market liquid", async () => {

        const btcAmount = ethers.utils.parseEther('1000');
        const usdcAmount = ethers.utils.parseEther('20000000');

        // mint

        await btc.connect(user1).mint(user1.address, btcAmount);
        await usdc.connect(user2).mint(user2.address, usdcAmount);

        // to market
        await exchange.connect(user1).mint(btc.address, btcAmount);
        await exchange.connect(user2).mint(usdc.address, usdcAmount);


        // Approval 

        await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
        await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);

        // approve for market
        await btc.connect(user1).approve(cBtc.address, ethers.constants.MaxUint256)
        await btc.connect(user2).approve(cBtc.address, ethers.constants.MaxUint256)
        await usdc.connect(user1).approve(cUsdc.address, ethers.constants.MaxUint256)

        await lever.connect(user1).enterMarkets([cBtc.address, cUsdc.address]);
        await lever.connect(user2).enterMarkets([cBtc.address, cUsdc.address]);

    })



    it(`user1 create margin order 1 btc @ 20000}`, async () => {
        const domain = {
            name: getConfig("name"),
            version: getVersion("test"),
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

        const value = {
            maker: user1.address.toLowerCase(),
            token0: btc.address.toLowerCase(),
            token1: usdc.address.toLowerCase(),
            amount: amount,
            orderType: orderType,
            salt: salt,
            exchangeRate: exchangeRate,
            borrowLimit: Big(0.75).times(Big(10).pow(6)).toNumber(),
            loops: loops
        };
        // The data to sign


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
                        borrowLimit: Big(0.75).times(Big(10).pow(6)).toNumber(),
                        loops: loops

                    },
                    "signature": storedSignature,
                    "chainId": chainId,
                    // "ipfs": true,
                }
            );
        console.log(res.body)
        expect(res).to.have.status(201);
        expect(res.body.status).to.be.equal(true);
        expect(res.body).to.be.an('object');
        expect(res.body.message).to.have.string('Order created successfully');

    });

    it(`find created order in data base`, async () => {

        let data = await Order.findOne({ signature: signatures[0] }).lean()! as ifOrderCreated;
        expect(data).to.be.an('object');
        expect(data.amount).to.equal(amount);
        expect(data.maker).to.equal(user1.address.toLowerCase());
        expect(Number(data.loops)).to.equal(loops)
        orderCreated.push(data)
    })

    it(`user1 sell usdc got from market to user2 and got 2 btc @ 20000`, async () => {
        let user1BtcBalancePre = btc.balanceOf(user1.address);
        let user2BtcBalancePre = btc.balanceOf(user2.address);
        let user2UsdcBalancePre = usdc.balanceOf(user2.address);
        let user1UsdcBalancePre = usdc.balanceOf(user1.address);
        let promise = await Promise.all([user1BtcBalancePre, user2BtcBalancePre, user2UsdcBalancePre, user1UsdcBalancePre])
        user1BtcBalancePre = promise[0].toString();
        user2BtcBalancePre = promise[1].toString()
        user2UsdcBalancePre = promise[2].toString()
        user1UsdcBalancePre = promise[3].toString()
        // console.log(user1BtcBalancePre)
        const btcAmount = ethers.utils.parseEther('2').toString();
        await lever.connect(user1).enterMarkets([cBtc.address, cUsdc.address]);
        await lever.connect(user2).enterMarkets([cBtc.address, cUsdc.address]);

        let exTxn = await exchange.connect(user2).executeT0LimitOrders(
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
        // console.log(user2UsdcBalancePost,btcAmount );

        let fee = await Sync.findOne().lean()! as any;
        let makerFeeAmount = Big(fee?.makerFee).div(1e18).times(btcAmount);

        let takerFeeAmount = Big(Big(fee.takerFee).div(1e18)).times(Big(btcAmount));

        expect(user2BtcBalancePost).to.equal(parseEther(Big(user2BtcBalancePre).minus(btcAmount).toString()));
        expect(user2UsdcBalancePost).to.equal(
            parseEther(
                Big(user2UsdcBalancePre)
                    .plus(
                        Big(btcAmount).minus(takerFeeAmount)
                            .times(exchangeRate)
                            .div(Big(10).pow(18))).toString()))

        let wait = () => {
            return new Promise((resolve, reject) => {

                let timeOutId = setTimeout(() => {
                    return resolve("Success")
                }, 7000)
            })
        }
        let res = await wait()
    });

    it(`cancelled  order `, async () => {

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
            })
        }
        let res = await wait()
        expect(res).to.equal("Success")
        let data = await Order.findOne({ signature: signatures[0] }).lean()! as ifOrderCreated;
        expect(data).to.be.an('object')
        expect(data).not.to.be.null;
        expect(data.cancelled).to.equal(true)

    })

});





