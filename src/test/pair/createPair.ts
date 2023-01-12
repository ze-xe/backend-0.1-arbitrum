
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
use(chaiHttp);
import { ethers } from "ethers";
import { getERC20ABI, getExchangeABI, getProvider } from "../../utils/utils";
import { getExchangeAddress } from "../../helper/chain";
import path from "path";
import { connect, OrderCreated } from "../../db";
import { ifOrderCreated } from "../../helper/interface";
import { BtcAddress, contractName, EthAddress, ExchangeAddress, LinkAddress, UsdcAddress, version, ZexeAddress } from "../../helper/constant";
import { handleOrderCancelled } from "../../handlers/exchange";
import { httpServer, server } from "../../../app";


// require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });



// main server must be close 

describe("Create Pair => Mint token, create order, deleteOrder", async () => {

    // requirements
    let chainId = "421613"
    let provider = getProvider(chainId);

    let exchange = new ethers.Contract(ExchangeAddress, getExchangeABI(), provider);
    let btc = new ethers.Contract(BtcAddress, getERC20ABI(), provider);
    let usdc = new ethers.Contract(UsdcAddress, getERC20ABI(), provider);
    let eth = new ethers.Contract(EthAddress, getERC20ABI(), provider);
    let zexe = new ethers.Contract(ZexeAddress, getERC20ABI(), provider);
    let link = new ethers.Contract(LinkAddress, getERC20ABI(), provider);
    let user1 = new ethers.Wallet(process.env.PRIVATE_KEY1! as string).connect(provider); //2
    let user2 = new ethers.Wallet(process.env.PRIVATE_KEY2! as string).connect(provider); //1


    let signatures: any[] = [];
    let orders: any[] = [];
    let orderCreated: any[] = []
    let exchangeRate = ethers.utils.parseEther('20000').toString();

    let salt = Math.floor(Math.random() * 9000000);
    let amount = ethers.utils.parseEther('1').toString();
    let orderType = 1 // sell

    before(async () => { //Before each test we empty the database   
        // await mongoose.createConnection(process.env.MONGO_URL! as string).dropDatabase();
        httpServer
        // await connect()
    });

    it('mint token0, token1', async () => {

        const btcAmount = ethers.utils.parseEther('10').toString();
        const zexeAmount = ethers.utils.parseEther('1000000').toString();
        const ethAmount = ethers.utils.parseEther('1000').toString();
        const linkAmount = ethers.utils.parseEther('10000').toString();
        const usdcAmount = ethers.utils.parseEther('1000000').toString();

        // user1 and user2 mint btc 
        await btc.connect(user1).mint(user1.address, btcAmount)
        await eth.connect(user1).mint(user1.address, ethAmount)
        await zexe.connect(user1).mint(user1.address, zexeAmount)
        await link.connect(user1).mint(user1.address, linkAmount)
        await usdc.connect(user2).mint(user2.address, usdcAmount)

        // approve for exchange  
        await btc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256)
        await eth.connect(user1).approve(exchange.address, ethers.constants.MaxUint256)
        await zexe.connect(user1).approve(exchange.address, ethers.constants.MaxUint256)
        await link.connect(user1).approve(exchange.address, ethers.constants.MaxUint256)
        const approve = await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256)

        await approve.wait(1)

    });


    it(`user1 create margin order 1 btc @ 20000}`, async () => {
        const domain = {
            name: contractName,
            version: version,
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
                .post(`/v/${version}/order/create`)
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

    it(`find created order in data base, cancel and delete it`, async () => {

        for (let i in signatures) {
            let data = await OrderCreated.findOne({ signature: signatures[i] }).lean()! as ifOrderCreated;

            expect(data).to.be.an('object');
            expect(data.amount).to.equal(amount);
            expect(data.maker).to.equal(user1.address.toLowerCase());
            await handleOrderCancelled([data.id]);

            let data1 = await OrderCreated.findOne({ signature: signatures[i] }).lean()! as ifOrderCreated;
            expect(data1).to.be.an('object');
            expect(data1.amount).to.equal(amount);
            expect(data1.cancelled).to.equal(true);
            await OrderCreated.findOneAndDelete({ signature: signatures[i] })
            let data2 = await OrderCreated.findOne({ signature: signatures[i] }).lean()! as ifOrderCreated;
            expect(data2).to.be.null;
            server.close((err) => {
                console.log('server closed')
                process.exit(0)
            })

        }


    })

});





