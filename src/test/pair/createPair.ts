
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
use(chaiHttp);
import { ethers } from "ethers";
import { getProvider } from "../../utils/utils";
import { getExchangeAddress, getVersion } from "../../helper/chain";
import { connect, Order, OrderExecuted } from "../../DB/db";
import { ifOrderCreated } from "../../helper/interface";
import { run } from "../../../app";
import { getConfig, getContract } from "../../helper/constant";
import { handleOrderCancelled } from "../../handlers/orderCancelled";
import { handleOrderExecuted } from "../../handlers/orderExecuted";


// require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });

require("dotenv").config()

// main server must be close 

describe("Create Pair => Mint token, create order, deleteOrder", async () => {

    // requirements
    let chainId = "421613"
    let provider = getProvider(chainId);

    let exchange = getContract("Exchange", chainId);
    let btc = getContract("BTC", chainId);
    let usdc = getContract("USDC", chainId);
    let eth = getContract("ETH", chainId);
    let zexe = getContract("ZEXE", chainId);
    let link = getContract("LINK", chainId);
    let user1 = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80").connect(provider); //2
    let user2 = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d").connect(provider); //1


    let signatures: any[] = [];
    let orders: any[] = [];
    let orderCreated: any[] = []
    let exchangeRate = ethers.utils.parseEther('20000').toString();

    let salt = Math.floor(Math.random() * 9000000);
    let amount = ethers.utils.parseEther('1').toString();
    let orderType = 1 // sell

    before(async () => {   
        await run()
    });

    after((done) => {
        done()
    })

    it(`user1 create margin order 1 btc @ 20000}`, async () => {
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

        let tokens = [btc, zexe, eth, link]
        for (let i in tokens) {

            const value = {
                maker: user1.address.toLowerCase(),
                token0: tokens[i].address.toLowerCase(),
                token1: usdc.address.toLowerCase(),
                amount: amount,
                orderType: orderType,
                salt: salt,
                exchangeRate: exchangeRate,
                borrowLimit: 0,
                loops: 0
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
            // console.log([
            //     value, storedSignature
            // ]);
            let res = await request("http://localhost:3010")
                .post(`/v/${getVersion(process.env.NODE_ENV!)}/order/create`)
                .send(
                    {
                        "data": {
                            "maker": user1.address.toLowerCase(),
                            "token0": tokens[i].address.toLowerCase(),
                            "token1": usdc.address.toLowerCase(),
                            "amount": amount,
                            "orderType": orderType,
                            "salt": salt,
                            "exchangeRate": exchangeRate,
                            borrowLimit: 0,
                            loops: 0

                        },
                        "signature": signatures[i],
                        "chainId": chainId,
                        "ipfs": true
                    }
                );
            // console.log(res.body)
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.equal(true);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.have.string('Order created successfully');

        }


    });

    it("execute 0ne order and check DB", async () => {
        let data = await Order.findOne({ signature: signatures[0] }).lean()! as ifOrderCreated;

        expect(data).to.be.an('object');
        expect(data.amount).to.equal(amount);
        expect(data.maker).to.equal(user1.address.toLowerCase());

        let fillAmount = ethers.utils.parseEther('0.5').toString();
        let input = [data.id, user2.address, fillAmount]
        await handleOrderExecuted(input, { chainId: chainId, txnId: 1, blockNumber: 1, blockTimestamp: Date.now() });

        let data1 = await OrderExecuted.findOne({ id: data.id }).lean()!;
        expect(data1).to.be.an('object');
        expect(data1).not.to.be.null;
        expect(data1?.fillAmount).to.equal(fillAmount);

        // delete from db executed order
        let delExecutedData = await OrderExecuted.deleteOne({ id: data.id });
        expect(delExecutedData.acknowledged).to.equal(true)
        expect(delExecutedData.deletedCount).to.equal(1)
    });
    it(`find created order in data base, cancel and delete it`, async () => {

        for (let i in signatures) {
            let data = await Order.findOne({ signature: signatures[i] }).lean()! as ifOrderCreated;

            expect(data).to.be.an('object');
            expect(data.amount).to.equal(amount);
            expect(data.maker).to.equal(user1.address.toLowerCase());
            await handleOrderCancelled([data.id]);

            let data1 = await Order.findOne({ signature: signatures[i] }).lean()! as ifOrderCreated;
            expect(data1).to.be.an('object');
            expect(data1.amount).to.equal(amount);
            expect(data1.cancelled).to.equal(true);
            await Order.findOneAndDelete({ signature: signatures[i] })
            let data2 = await Order.findOne({ signature: signatures[i] }).lean()! as ifOrderCreated;
            expect(data2).to.be.null;


        }

        // server.close((err) => {
        //     console.log('server closed')
        //     process.exit(0)
        // })


    })

});





