
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
use(chaiHttp);
import { ethers } from "ethers";
import Big from "big.js";
import { BtcAddress, UsdcAddress, ExchangeAddress, leverAddress, cUsdcAddress, cBtcAddress } from '../helper/contractDeployment';
import { EVENT_NAME } from "../../socketIo/socket.io";
import { getERC20ABI, getExchangeABI, getProvider, leverageAbi, parseEther } from "../../utils";
import { getExchangeAddress } from "../../helper/chain";
import { io } from "socket.io-client";
import path from "path";
import { connect } from "../../db";



require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });



const socket = io("http://localhost:3010");

socket.on(EVENT_NAME.PAIR_ORDER, (data) => {
    console.log("pairOrders", data)
});

socket.on(EVENT_NAME.PAIR_HISTORY, (data) => {
    console.log("pairHistory", data)
})


describe("Margin order, create, execute, cancel", async () => {

    // requirements
    let chainId = "421613"
    let provider = getProvider(chainId);

    let exchange = new ethers.Contract(ExchangeAddress, getExchangeABI(), provider);
    let btc = new ethers.Contract(
        BtcAddress,
        // EthAddress, 
        getERC20ABI(), provider);
    let usdc = new ethers.Contract(UsdcAddress, getERC20ABI(), provider);
    let lever = new ethers.Contract(leverAddress, leverageAbi, provider);
    let cUsdc = new ethers.Contract(cUsdcAddress, getERC20ABI(), provider);
    let cBtc = new ethers.Contract(cBtcAddress, getERC20ABI(), provider);
    let user1 = new ethers.Wallet(process.env.PRIVATE_KEY1! as string).connect(provider); //2
    let user2 = new ethers.Wallet(process.env.PRIVATE_KEY1! as string).connect(provider); //1


    let signatures: any[] = [];
    let orders: any[] = [];
    let exchangeRate = ethers.utils.parseEther('20000').toString();

    let salt = Math.floor(Math.random() * 9000000);
    let amount = ethers.utils.parseEther('1').toString();
    let long = true;
    let loops = 5;
    let orderType = 2 // long

    before(async () => { //Before each test we empty the database   
        // await mongoose.createConnection(process.env.MONGO_URL! as string).dropDatabase();
        // httpServer
        await connect()
    });

    it('mint 10 btc to user1, 2000000 usdt to user2', async () => {
        let user1BtcBalancePre = (await btc.balanceOf(user1.address)).toString();
        let user2UsdcBalancePre = (await usdc.balanceOf(user2.address)).toString();

        const btcAmount = ethers.utils.parseEther('100').toString();
        let tx1 = await btc.connect(user1).mint(user1.address, btcAmount);
        // approve for exchange
        let approve = await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
        await btc.connect(user1).approve(cBtc.address, ethers.constants.MaxUint256)
        const usdcAmount = ethers.utils.parseEther('2000000').toString();
        let tx2 = await usdc.connect(user2).mint(user2.address, usdcAmount);
        // approve for exchange
        let approve1 = await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);
        await btc.connect(user2).approve(cUsdc.address, ethers.constants.MaxUint256)
        let user1BtcBalancePost = (await btc.balanceOf(user1.address)).toString();
        let user2UsdcBalancePost = (await usdc.balanceOf(user2.address)).toString();

        expect(user1BtcBalancePost).to.equal(parseEther(Big(btcAmount).plus(user1BtcBalancePre).toString()));
        expect(user2UsdcBalancePost).to.equal(parseEther(Big(usdcAmount).plus(user2UsdcBalancePre).toString()));
    });

    it("make market liquid", async () => {

        const btcAmount = ethers.utils.parseEther('100');
        await btc.connect(user1).mint(user1.address, btcAmount);
        await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
        await exchange.connect(user1).mint(btc.address, btcAmount);

        const usdcAmount = ethers.utils.parseEther('2000000');
        await usdc.connect(user2).mint(user2.address, usdcAmount)
        await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);
        await exchange.connect(user2).mint(usdc.address, usdcAmount);
    })


    it(`user1 create margin order 1 btc @ 20000}`, async () => {
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
                        borrowLimit: Big(0.75).times(Big(10).pow(6)).toNumber(),
                        loops: loops

                    },
                    "signature": storedSignature,
                    "chainId": chainId
                }
            );

        expect(res).to.have.status(201);
        expect(res.body.status).to.be.equal(true);
        expect(res.body).to.be.an('object');
        expect(res.body.message).to.have.string('Order created successfully');

    });

    /*
 
     it(`user2 buy user1s btc order @ ${+exchangeRate / 10 ** 18}`, async () => {
         let user1BtcBalancePre = (await btc.balanceOf(user1.address)).toString() / 10 ** 18;
         let user2BtcBalancePre = (await btc.balanceOf(user2.address)).toString() / 10 ** 18;
         let user2UsdcBalancePre = (await usdc.balanceOf(user2.address)).toString() / 10 ** 18;
         let user1UsdcBalancePre = (await usdc.balanceOf(user1.address)).toString() / 10 ** 18;
         console.log("1PreBtc", user1BtcBalancePre);
         console.log("1Preusdc", user1UsdcBalancePre);
         console.log("2PreUsdc", user2UsdcBalancePre);
         console.log("2PreBtc", user2BtcBalancePre);
         // console.log(signatures[0])
         // console.log(orders[0])
         const btcAmount = ethers.utils.parseEther('5');
         // const btcAmount = ethers.utils.parseEther(Big(amount).times(((Big(0.75).pow(6)).minus(1)).div(Big(0.75).minus(1))).minus(amount).div(Big(10).pow(18)).toString());
         // const btcAmount =  Big(amount).times(((Big(0.75).pow(6)).minus(1)).div(Big(0.75).minus(1))).minus(amount).toString()
         await lever.connect(user1).enterMarkets([cBtc.address, cUsdc.address]);
         await lever.connect(user2).enterMarkets([cBtc.address, cUsdc.address]);
 
         console.log("btcAmount---", (+btcAmount / 10 ** 18).toString());
         let exTxn = await exchange.connect(user2).executeLeverageOrder(
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
         exTxn.wait(1).then(async (resp: any) => {
             user1BtcBalancePost = (await btc.balanceOf(user1.address)).toString() / 10 ** 18;
             user1UsdcBalancePost = (await usdc.balanceOf(user1.address)).toString() / 10 ** 18;
             user2UsdcBalancePost = (await usdc.balanceOf(user2.address)).toString() / 10 ** 18;
             user2BtcBalancePost = (await btc.balanceOf(user2.address)).toString() / 10 ** 18;
 
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
    //         exTxn.wait(1).then(async (resp: any) => {
    //             // console.log(resp)
    //         })
    //     }
    //     catch(error){
    //         console.log(error)
    //     }


    // })




});





