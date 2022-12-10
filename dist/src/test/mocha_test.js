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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_2 = require("chai");
const chai_http_1 = __importDefault(require("chai-http"));
(0, chai_1.use)(chai_http_1.default);
const ethers_1 = require("ethers");
const utils_1 = require("../utils");
const big_js_1 = __importDefault(require("big.js"));
const constant_1 = require("../helper/constant");
describe("zexe order creation", () => __awaiter(void 0, void 0, void 0, function* () {
    // requirements
    let chainId = "421613";
    let provider = (0, utils_1.getProvider)(chainId);
    let exchange = new ethers_1.ethers.Contract(constant_1.ExchangeAddress, (0, utils_1.getExchangeABI)(), provider);
    let btc = new ethers_1.ethers.Contract(constant_1.BtcAddress, (0, utils_1.getERC20ABI)(), provider);
    let usdc = new ethers_1.ethers.Contract(constant_1.UsdcAddress, (0, utils_1.getERC20ABI)(), provider);
    let user1 = new ethers_1.ethers.Wallet("0x7cf03fae45cb10d4e3ba00a10deeacfc8cea1be0eebcfb7277a7df2e5074a405").connect(provider); //1
    let user2 = new ethers_1.ethers.Wallet("0xcdb7f4e35a4443b45b8316666caa396b7a9f4686fcff1901c008b15a2fa2e904").connect(provider); //2
    let signatures = [];
    let orders = [];
    let exchangeRate = (0, big_js_1.default)(25000 - Math.floor(Math.random() * 10000)).times((0, big_js_1.default)(10).pow(18)).toFixed(0);
    let salt = Math.floor(Math.random() * 9000000);
    let amount = ethers_1.ethers.utils.parseEther(`${Math.random()}`).toString();
    let buy = true;
    /*
    it('mint 10 btc to user1, 2000000 usdt to user2', async () => {
        let user1BtcBalancePre = await btc.balanceOf(user1.address);
        let user2UsdcBalancePre = await usdc.balanceOf(user2.address);

        const btcAmount = ethers.utils.parseEther('100');
        let tx1 = await btc.connect(user1).mint(user1.address, btcAmount);
        // approve for exchange
        let approve = await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);

        const usdcAmount = ethers.utils.parseEther('2000000');
        let tx2 = await usdc.connect(user2).mint(user2.address, usdcAmount);
        // approve for exchange
        let approve1 = await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);

        let user1BtcBalancePost = await btc.balanceOf(user1.address);
        let user2UsdcBalancePost = await usdc.balanceOf(user2.address);

        // expect(user1BtcBalancePost.toString()).to.equal(ethers.utils.parseEther(`${Big(btcAmount).plus(user1BtcBalancePre).div(Big(10).pow(18))}`).toString());
        // expect(user2UsdcBalancePost.toString()).to.equal(ethers.utils.parseEther(`${Big(usdcAmount).plus(user2UsdcBalancePre).div(Big(10).pow(18))}`).toString());

    });
    */
    it(`user1 creates limit order to sell ${+amount / 10 ** 18} btc @ ${+exchangeRate / 10 ** 18}`, () => __awaiter(void 0, void 0, void 0, function* () {
        const domain = {
            name: "zexe",
            version: "1",
            chainId: chainId.toString(),
            verifyingContract: (0, utils_1.getExchangeAddress)(chainId),
        };
        // The named list of all type definitions
        const types = {
            Order: [
                { name: "maker", type: "address" },
                { name: "token0", type: "address" },
                { name: "token1", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "buy", type: "bool" },
                { name: "salt", type: "uint32" },
                { name: "exchangeRate", type: "uint216" }
            ],
        };
        // The data to sign
        const value = {
            maker: user1.address,
            token0: btc.address,
            token1: usdc.address,
            amount: amount,
            buy: buy,
            salt: salt,
            exchangeRate: exchangeRate
        };
        orders.push(value);
        // sign typed data
        const storedSignature = yield user1._signTypedData(domain, types, value);
        signatures.push(storedSignature);
        console.log([
            value, storedSignature
        ]);
        let res = yield (0, chai_1.request)("http://localhost:3010")
            .post("/order/create")
            .send({
            "data": {
                "maker": user1.address,
                "token0": btc.address,
                "token1": usdc.address,
                "amount": amount,
                "buy": buy,
                "salt": salt,
                "exchangeRate": exchangeRate
            },
            "signature": storedSignature,
            "chainId": chainId
        });
        console.log(res.text);
        (0, chai_2.expect)(res).to.have.status(201);
    }));
    /*
    it(`user2 buy user1s btc order @ ${exchangeRate / 10 ** 18}`, async () => {
        let user1BtcBalancePre = (await btc.balanceOf(user1.address)).toString();
        let user2BtcBalancePre = (await btc.balanceOf(user2.address)).toString();
        let user2UsdcBalancePre = (await usdc.balanceOf(user2.address)).toString();
        let user1UsdcBalancePre = (await usdc.balanceOf(user1.address)).toString();
        console.log("1PreBtc", user1BtcBalancePre);
        console.log("1Preusdc", user1UsdcBalancePre);
        console.log("2PreUsdc", user2UsdcBalancePre);
        console.log("2PreBtc", user2BtcBalancePre);
        // console.log(signatures[0])
        // console.log(orders[0])
        const btcAmount = ethers.utils.parseEther(`${Math.random()*0.5}`);
        console.log("btcAmount---", (btcAmount/10**18).toString());
        let exTxn = await exchange.connect(user2).executeLimitOrder(
            signatures[0],
            orders[0],
            btcAmount,
            { gasLimit: "100000000" }
        );
        let user1BtcBalancePost;
        let user1UsdcBalancePost;
        let user2UsdcBalancePost;
        let user2BtcBalancePost;
        // console.log(await exTxn.wait(1))
        exTxn.wait(1).then(async (resp) => {
            user1BtcBalancePost = (await btc.balanceOf(user1.address)).toString();
            user1UsdcBalancePost = (await usdc.balanceOf(user1.address)).toString();
            user2UsdcBalancePost = (await usdc.balanceOf(user2.address)).toString();
            user2BtcBalancePost = (await btc.balanceOf(user2.address)).toString();

            console.log("1PostB", user1BtcBalancePost);
            console.log("1PostU", user1UsdcBalancePost);
            console.log("2PostU", user2UsdcBalancePost);
            console.log("2PostB", user2BtcBalancePost);
            // console.log(resp)

            // expect(user1BtcBalancePost).to.equal(Big(user1BtcBalancePre).minus(btcAmount).toString());
            // expect(user1UsdcBalancePost).to.equal(Big(user1BtcBalancePre).plus(Big(btcAmount).times(exchangeRate).div(Big(10).pow(18))).toString());


        });

    });
    */
    // it(`cancelled  order `, async () => {
    //     try{
    //         let exTxn = await exchange.connect(user1).cancelOrder(
    //             signatures[0],
    //             orders[0],
    //             { gasLimit: "100000000" }
    //         )
    //         exTxn.wait(1).then(async (resp) => {
    //             // console.log(resp)
    //         })
    //     }
    //     catch(error){
    //         console.log(error)
    //     }
    // })
}));
