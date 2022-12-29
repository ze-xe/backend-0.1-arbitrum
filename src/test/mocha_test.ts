
import { use, request } from "chai";
import { expect, assert } from "chai";
import chaiHttp from "chai-http";
use(chaiHttp);
import { ethers } from "ethers";
import { getExchangeABI, getERC20ABI, getProvider } from "../utils";
import Big from "big.js";
import { BtcAddress, UsdcAddress, ExchangeAddress, EthAddress } from '../helper/constant';
import { clinetSocketService } from "./socket-client";
import { io, connect } from "socket.io-client";
import { getExchangeAddress } from "../helper/chain";
import { EVENT_NAME } from "../socketIo/socket.io";

// clinetSocketService.on("connect", (socket: any) => {
//     console.log(socket.id);
// });
let pair = `0xe60f271e5d59a3e256782ed3377d3b2324756e7d3a5d18038b9cb14c8e28e22b`;
const socket = io("http://localhost:3010");

// socket.on("connect", () => {
//     console.log("socket connected @ client side",socket.connected);
// });

socket.on(EVENT_NAME.PAIR_ORDER, (data) => {
    console.log("pairOrders", data)
});

socket.on(EVENT_NAME.PAIR_HISTORY, (data) => {
    console.log("pairHistory", data)
})


describe("zexe order creation", async () => {

    // requirements
    let chainId = "421613"
    let provider = getProvider(chainId);

    let exchange = new ethers.Contract(ExchangeAddress, getExchangeABI(), provider);
    let btc = new ethers.Contract(
        BtcAddress,
        // EthAddress, 
        getERC20ABI(), provider);
    let usdc = new ethers.Contract(UsdcAddress, getERC20ABI(), provider);

    let user1 = new ethers.Wallet("0x7cf03fae45cb10d4e3ba00a10deeacfc8cea1be0eebcfb7277a7df2e5074a405").connect(provider); //1
    let user2 = new ethers.Wallet("0xcdb7f4e35a4443b45b8316666caa396b7a9f4686fcff1901c008b15a2fa2e904").connect(provider); //2
    let signatures: any[] = [];
    let orders: any[] = [];
    let exchangeRate = Big(20000 - Math.floor(Math.random() * 5000)).times(Big(10).pow(18)).toFixed(0);
    // let exchangeRate = Big(1000 - Math.floor(Math.random() * 500)).times(Big(10).pow(18)).toFixed(0);

    let salt = Math.floor(Math.random() * 9000000);
    let amount = ethers.utils.parseEther(`${Math.random() * 5}`).toString();
    let orderType = 1;

    /* 
  it('mint 10 btc to user1, 2000000 usdt to user2', async () => {
      // let user1BtcBalancePre = await btc.balanceOf(user1.address);
      // let user2UsdcBalancePre = await usdc.balanceOf(user2.address);

      const btcAmount = ethers.utils.parseEther('100000');
      let tx1 = await btc.connect(user1).mint(user1.address, btcAmount);
      // approve for exchange
      let approve = await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
      let approve2 = await btc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);

      const usdcAmount = ethers.utils.parseEther('2000000');
      // let tx2 = await usdc.connect(user2).mint(user2.address, usdcAmount);
      // approve for exchange
      let approve1 = await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);
      let approve3 = await usdc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);

      // let user1BtcBalancePost = await btc.balanceOf(user1.address);
      // let user2UsdcBalancePost = await usdc.balanceOf(user2.address);

      // expect(user1BtcBalancePost.toString()).to.equal(ethers.utils.parseEther(`${Big(btcAmount).plus(user1BtcBalancePre).div(Big(10).pow(18))}`).toString());
      // expect(user2UsdcBalancePost.toString()).to.equal(ethers.utils.parseEther(`${Big(usdcAmount).plus(user2UsdcBalancePre).div(Big(10).pow(18))}`).toString());

  });
  */

    it(`user1 creates limit order to sell ${+amount / 10 ** 18} btc @ ${+exchangeRate / 10 ** 18}`, async () => {
        const domain = {
            name: "zexe",
            version: "1",
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
        let res = await request("http://localhost:3010")
            .post("/order/create")
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

        console.log(res.text);



        expect(res).to.have.status(201);

    });


    it(`user2 buy user1s btc order @ ${+exchangeRate / 10 ** 18}`, async () => {
        // let user1BtcBalancePre = (await btc.balanceOf(user1.address)).toString();
        // let user2BtcBalancePre = (await btc.balanceOf(user2.address)).toString();
        // let user2UsdcBalancePre = (await usdc.balanceOf(user2.address)).toString();
        // let user1UsdcBalancePre = (await usdc.balanceOf(user1.address)).toString();
        // console.log("1PreBtc", user1BtcBalancePre);
        // console.log("1Preusdc", user1UsdcBalancePre);
        // console.log("2PreUsdc", user2UsdcBalancePre);
        // console.log("2PreBtc", user2BtcBalancePre);
        // console.log(signatures[0])
        // console.log(orders[0])
        const btcAmount = ethers.utils.parseEther(`${Math.random() * 4}`);
        console.log("btcAmount---", (+btcAmount / 10 ** 18).toString());
        let exTxn = await exchange.connect(user2).executeLimitOrders(
            [signatures[0]],
            [orders[0]],
            btcAmount,
            { gasLimit: "100000000" }
        );
        let user1BtcBalancePost;
        let user1UsdcBalancePost;
        let user2UsdcBalancePost;
        let user2BtcBalancePost;
        // console.log(await exTxn.wait(1))
        await exTxn.wait(1).then(async (resp: any) => {
            // user1BtcBalancePost = (await btc.balanceOf(user1.address)).toString();
            // user1UsdcBalancePost = (await usdc.balanceOf(user1.address)).toString();
            // user2UsdcBalancePost = (await usdc.balanceOf(user2.address)).toString();
            // user2BtcBalancePost = (await btc.balanceOf(user2.address)).toString();

            // console.log("1PostB", user1BtcBalancePost);
            // console.log("1PostU", user1UsdcBalancePost);
            // console.log("2PostU", user2UsdcBalancePost);
            // console.log("2PostB", user2BtcBalancePost);
            console.log("Done")

            // expect(user1BtcBalancePost).to.equal(Big(user1BtcBalancePre).minus(btcAmount).toString());
            // expect(user1UsdcBalancePost).to.equal(Big(user1BtcBalancePre).plus(Big(btcAmount).times(exchangeRate).div(Big(10).pow(18))).toString());


        });

    });





    // it(`cancelled  order `, async () => {

    //     try{

    //         let exTxn = await exchange.connect(user1).cancelOrder(
    //             signatures[0],
    //             orders[0],
    //             { gasLimit: "100000000" }
    //         )
    //         exTxn.wait(1).then(async (resp: any) => {
    //             // console.log(resp)
    //         })
    //     }
    //     catch(error){
    //         console.log(error)
    //     }


    // })




});





