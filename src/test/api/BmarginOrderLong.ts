
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
use(chaiHttp);
import { ethers } from "ethers";
import Big from "big.js";
import { EVENT_NAME } from "../../socketIo/socket.io";
import { getABI, getProvider, parseEther } from "../../utils/utils";
import { getExchangeAddress, getVersion } from "../../helper/chain";
import { io } from "socket.io-client";
import path from "path";
import { connect, Order, Sync, User } from "../../DB/db";
import { ifOrderCreated } from "../../helper/interface";
import { getConfig, getContract } from "../../helper/constant";



require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });

// 0xd4282DdAC1A8686695e00Ea9BB6cF542A3271CA4 pool proxy address

const socket = io("http://localhost:3010");

describe("Margin Order Long => Mint token, create order, execute order, cancel order", async () => {

    // requirements
    let chainId = "421613"
    let provider = getProvider(chainId);

    let spot = getContract("Spot", chainId)
    let weth = getContract("WETH", chainId)
    let usdc = getContract("USDC", chainId)
    let aave = getContract("DAI", chainId)
    let pool = new ethers.Contract("0xd4282DdAC1A8686695e00Ea9BB6cF542A3271CA4", getABI("IPool"), provider);
    // let pool = new ethers.Contract(await spot.POOL(), getABI("IPool"), provider);
    let user1 = new ethers.Wallet(process.env.PRIVATE_KEY1! as string).connect(provider); //2
    let user2 = new ethers.Wallet(process.env.PRIVATE_KEY2! as string).connect(provider); //1
    let owner = new ethers.Wallet(process.env.PRIVATE_KEY3! as string).connect(provider); //1


    let signatures: any[] = [];
    let orders: any[] = [];
    let orderCreated: any[] = []
    let price = ethers.utils.parseEther('1000').toString();
    let nonce = Math.floor(Math.random() * 9000000);
    let amount0 = ethers.utils.parseEther('1').toString();
    let amount1 = ethers.utils.parseEther('1000').toString();
    let expiry = ((Date.now() / 1000) + 7 * 24 * 60 * 60).toFixed(0)
    let name = "zexe";
    let version = "1"

    before(async () => {

        await connect()
    });
    /*
    it('mint 100 weth to user1, 100 weth to user2', async () => {
        // ORDER IS LONG means user1 want more weth
        let ownerAddress = "0x95D2aefD060DB5Da61e31FfF7A855cc4c7ef6160";
        let user1wethBalancePre = (await weth.balanceOf(user1.address)).toString();
        let user2wethBalancePre = (await weth.balanceOf(user2.address)).toString();
        // await weth.connect(user1).transfer(owner.address, await weth.balanceOf(user1.address));
        // await weth.connect(user2).transfer(owner.address, await weth.balanceOf(user2.address));
        // await usdc.connect(user2).transfer(owner.address, await usdc.balanceOf(user2.address));
 
    
        // user1 and user2 mint weth 
        await weth.connect(user1).mint(user1.address, ethers.utils.parseEther('1').toString())
        await weth.connect(user2).mint(user2.address, ethers.utils.parseEther('10').toString())
 
        // approve for spot  
        await weth.connect(user1).approve(spot.address, ethers.constants.MaxUint256)
        await usdc.connect(user1).approve(spot.address, ethers.constants.MaxUint256) // as it will sell usdc to buy weth
        await weth.connect(user2).approve(spot.address, ethers.constants.MaxUint256)
 
        // approve for market
       
        let user1wethBalancePost = (await weth.balanceOf(user1.address)).toString();
        let user2wethBalancePost = (await weth.balanceOf(user2.address)).toString();
 
        // expect(user1wethBalancePost).to.equal(parseEther(Big(ethers.utils.parseEther('1').toString()).plus(user1wethBalancePre).toString()));
        // expect(user2wethBalancePost).to.equal(parseEther(Big(ethers.utils.parseEther('10').toString()).plus(user2wethBalancePre).toString()));
 
    });

    
    it("make market liquid", async () => {
 
        const wethAmount = ethers.utils.parseEther('1000');
        const usdcAmount = ethers.utils.parseEther('20000000');
 
        // mint
 
        // await weth.connect(owner).mint(owner.address, wethAmount);
        // await usdc.connect(owner).mint(owner.address, usdcAmount);
 
        
 
 
        // Approval 
    
        await weth.connect(owner).approve(pool.address, ethers.constants.MaxUint256);
        await usdc.connect(owner).approve(pool.address, ethers.constants.MaxUint256);
        console.log(pool);
        await pool.connect(owner).supply(usdc.address, usdcAmount, owner.address, 0);
        await pool.connect(owner).supply(weth.address, wethAmount, owner.address, 0);
        // market enter
        // await lever.connect(user1).enterMarkets([cweth.address, cUsdc.address]);
        // await lever.connect(user2).enterMarkets([cweth.address, cUsdc.address]);
 
    })*/

    it('create cross position', async () => {
        await spot.connect(user1).createPosition([aave.address, usdc.address]);
        // require(await spot.totalPositions(user1.address)).to.equal('1');
        // require(await spot.position(user1.address, 0)).to.not.equal(ethers.constants.AddressZero);
    })
    
    it('user1 longs 1 eth with 5x leverage', async () => {

        const domain = {
            name: getConfig("name"),
            version: getVersion(process.env.NODE_ENV!),
            chainId: chainId.toString(),
            verifyingContract: getExchangeAddress(chainId),
        };


        const types = {
            Order: [
                { name: 'maker', type: 'address' },
                { name: 'token0', type: 'address' },
                { name: 'token1', type: 'address' },
                { name: 'token0Amount', type: 'uint256' },
                { name: 'token1Amount', type: 'uint256' },
                { name: 'leverage', type: 'uint256' },
                { name: 'price', type: 'uint256' },
                { name: 'expiry', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'action', type: 'uint256' },
                { name: 'position', type: 'uint256' }
            ],
        };

        // The data to sign
        const value = {
            maker: user1.address.toLowerCase(),
            token0: weth.address.toLowerCase(),
            token1: usdc.address.toLowerCase(),
            token0Amount: amount0,
            token1Amount: amount1,
            leverage: 5,
            price: price,
            expiry: expiry,
            nonce: nonce,
            action: 0,  // 2 for limit, 0 for open, 1 for close
            position: 0 // for cross
        };

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

        let userPositionPre = await User.findOne({ token: weth.address.toLowerCase(), id: user1.address.toLowerCase() }).lean();

        let userInOrder = userPositionPre?.inOrderBalance ?? '0';

        let res = await request("http://localhost:3010")
            .post(`/v/${getVersion(process.env.NODE_ENV!)}/order/create`)
            .send(
                {
                    "data": {
                        maker: user1.address.toLowerCase(),
                        token0: weth.address.toLowerCase(),
                        token1: usdc.address.toLowerCase(),
                        token0Amount: amount0,
                        token1Amount: amount1,
                        leverage: 5,
                        price: price,
                        expiry: expiry,
                        nonce: nonce,
                        action: 0,  // 2 for limit, 0 for open, 1 for close
                        position: 0 // for cross
                    },
                    "signature": storedSignature.toLowerCase(),
                    "chainId": chainId
                }
            );

        let userPositionPost = await User.findOne({ token: weth.address.toLowerCase(), id: user1.address.toLowerCase() }).lean()
        console.log(res.body)
        // expect(res).to.have.status(201);
        // expect(res.body.status).to.be.equal(true);
        // expect(res.body).to.be.an('object');
        // expect(res.body.message).to.have.string('Order created successfully');
        // expect(userPositionPost).not.to.be.null;
        // expect(userPositionPost?.inOrderBalance).to.equal(Big(userInOrder).plus(amount0).toString())
    })

    it('user2 sells 5 eth for 5000 usdt', async () => {
        const amount = ethers.utils.parseEther('2000');

        await spot.connect(user2).execute(
            orders,
            signatures,
            usdc.address,
            amount,
            weth.address,
            ethers.constants.HashZero
        );

        // expect(await WETH.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('1'));
        // expect(await USDT.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('9000'));
        // expect(await WETH.balanceOf(user1.address)).to.equal(ethers.utils.parseEther('0'));
        // console.log(await WETH.balanceOf(user2.address))
        // console.log(await USDT.balanceOf(user2.address))
        // console.log(await WETH.balanceOf(user1.address))
        // console.log(await USDT.balanceOf(user1.address))
        // console.log('________');
    });

    // it("cancel Order", async ()=>{

    //     await spot.connect(user1).cancelOrder(
    //         orders[0],
    //         signatures[0]
    //     )
    // })
    /*
    it('user1 close 1 eth with 3eth leverage', async () => {

        const domain = {
            name: getConfig("name"),
            version: getVersion(process.env.NODE_ENV!),
            chainId: chainId.toString(),
            verifyingContract: getExchangeAddress(chainId),
        };


        const types = {
            Order: [
                { name: 'maker', type: 'address' },
                { name: 'token0', type: 'address' },
                { name: 'token1', type: 'address' },
                { name: 'token0Amount', type: 'uint256' },
                { name: 'token1Amount', type: 'uint256' },
                { name: 'leverage', type: 'uint256' },
                { name: 'price', type: 'uint256' },
                { name: 'expiry', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'action', type: 'uint256' },
                { name: 'position', type: 'uint256' }
            ],
        };

        // The data to sign
        const value = {
            maker: user1.address.toLowerCase(),
            token0: usdc.address.toLowerCase(),
            token1: weth.address.toLowerCase(),
            token0Amount: ethers.utils.parseEther('1000').toString(),
            token1Amount: ethers.utils.parseEther('1').toString(),
            leverage: 5,
            price: price,
            expiry: expiry,
            nonce: nonce,
            action: 1,  // 2 for limit, 0 for open, 1 for close
            position: 0 // for cross
        };

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

        let userPositionPre = await User.findOne({ token: weth.address.toLowerCase(), id: user1.address.toLowerCase() }).lean();

        let userInOrder = userPositionPre?.inOrderBalance ?? '0';

        let res = await request("http://localhost:3010")
            .post(`/v/${getVersion(process.env.NODE_ENV!)}/order/create`)
            .send(
                {
                    "data": {
                        maker: user1.address.toLowerCase(),
                        token0: usdc.address.toLowerCase(),
                        token1: weth.address.toLowerCase(),
                        token0Amount: ethers.utils.parseEther('1000').toString(),
                        token1Amount: ethers.utils.parseEther('1').toString(),
                        leverage: 5,
                        price: price,
                        expiry: expiry,
                        nonce: nonce,
                        action: 1,  // 2 for limit, 0 for open, 1 for close
                        position: 0 // for cross
                    },
                    "signature": storedSignature.toLowerCase(),
                    "chainId": chainId
                }
            );

        let userPositionPost = await User.findOne({ token: weth.address.toLowerCase(), id: user1.address.toLowerCase() }).lean()
        console.log(res.body)
        // expect(res).to.have.status(201);
        // expect(res.body.status).to.be.equal(true);
        // expect(res.body).to.be.an('object');
        // expect(res.body.message).to.have.string('Order created successfully');
        // expect(userPositionPost).not.to.be.null;
        // expect(userPositionPost?.inOrderBalance).to.equal(Big(userInOrder).plus(amount0).toString())
    })

    it('user2 closes 60% position', async () => {
        const amount = ethers.utils.parseEther('1');
        // await usdc.connect(user2).approve(spot.address, ethers.constants.MaxUint256)
        // await usdc.connect(user2).increaseAllowance(spot.address, ethers.utils.parseEther('9200'));
        // await usdc.connect(user2).increaseAllowance(spot.address, Big(amount).plus(ethers.utils.parseEther('3000').toString()));

        // console.log(await WETH.balanceOf(user2.address));
        // console.log(await USDT.balanceOf(user2.address));
        await spot.connect(user2).execute(
            [orders[0]],
            [signatures[0]],
            weth.address,
            amount,
            usdc.address,
            ethers.constants.HashZero
        )
        // let crossPosition = await Margin.crossPosition(user1.address);
        // console.log("getUserAccountData",await Pool.getUserAccountData(crossPosition));
        // console.log("getUserConfiguration",await Pool.getUserConfiguration(crossPosition));
        // console.log("getUserEMode",await Pool.getUserEMode(crossPosition));
        // console.log("getReserveNormalizedIncome",await Pool.getReserveNormalizedIncome(crossPosition));
        // console.log("getReserveData",await Pool.getReserveData(crossPosition));
        // console.log(await WETH.balanceOf(user1.address));
        // console.log(await USDT.balanceOf(user1.address));
        // console.log(await WETH.balanceOf(user2.address));
        // console.log(await USDT.balanceOf(user2.address));
        // expect(await WETH.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('5'));
        // expect(await USDT.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('4500'));
    })*/

    /*
it(`user1 create margin order 1 weth @ 20000}`, async () => {
    const domain = {
        name: getConfig("name"),
        version: getVersion(process.env.NODE_ENV!),
        chainId: chainId.toString(),
        verifyingContract: getspotAddress(chainId),
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
            { name: 'spotRate', type: 'uint176' },
            { name: 'borrowLimit', type: 'uint32' },
            { name: 'loops', type: 'uint8' }
        ]
    };

    const value = {
        maker: user1.address.toLowerCase(),
        token0: weth.address.toLowerCase(),
        token1: usdc.address.toLowerCase(),
        amount: amount,
        orderType: orderType,
        salt: salt,
        spotRate: spotRate,
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
        .post(`/v/${getVersion(process.env.NODE_ENV!)}/order/create`)
        .send(
            {
                "data": {
                    "maker": user1.address.toLowerCase(),
                    "token0": weth.address.toLowerCase(),
                    "token1": usdc.address.toLowerCase(),
                    "amount": amount,
                    "orderType": orderType,
                    "salt": salt,
                    "spotRate": spotRate,
                    borrowLimit: Big(0.75).times(Big(10).pow(6)).toNumber(),
                    loops: loops

                },
                "signature": storedSignature,
                "chainId": chainId
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

it(`user1 sell usdc got from market to user2 and got 2 weth @ 20000`, async () => {
    let user1wethBalancePre = weth.balanceOf(user1.address);
    let user2wethBalancePre = weth.balanceOf(user2.address);
    let user2UsdcBalancePre = usdc.balanceOf(user2.address);
    let user1UsdcBalancePre = usdc.balanceOf(user1.address);
    let promise = await Promise.all([user1wethBalancePre, user2wethBalancePre, user2UsdcBalancePre, user1UsdcBalancePre])
    user1wethBalancePre = promise[0].toString();
    user2wethBalancePre = promise[1].toString()
    user2UsdcBalancePre = promise[2].toString()
    user1UsdcBalancePre = promise[3].toString()
    // console.log(user1wethBalancePre)
    const wethAmount = ethers.utils.parseEther('2').toString();


    let exTxn = await spot.connect(user2).executeT0LimitOrders(
        [signatures[0]],
        [orders[0]],
        wethAmount,
        { gasLimit: "100000000" }
    );

    await exTxn.wait(1)
    let user1wethBalancePost = weth.balanceOf(user1.address);
    let user1UsdcBalancePost = usdc.balanceOf(user1.address);
    let user2UsdcBalancePost = usdc.balanceOf(user2.address);
    let user2wethBalancePost = weth.balanceOf(user2.address);

    let promise1 = await Promise.all([user1wethBalancePost, user1UsdcBalancePost, user2UsdcBalancePost, user2wethBalancePost]);
    user1wethBalancePost = promise1[0].toString();
    user1UsdcBalancePost = promise1[1].toString();
    user2UsdcBalancePost = promise1[2].toString();
    user2wethBalancePost = promise1[3].toString();
    // console.log(user2UsdcBalancePost,wethAmount );

    let fee = await Sync.findOne().lean()! as any;
    let makerFeeAmount = Big(fee?.makerFee).div(1e18).times(wethAmount);

    let takerFeeAmount = Big(Big(fee.takerFee).div(1e18)).times(Big(wethAmount));

    expect(user2wethBalancePost).to.equal(parseEther(Big(user2wethBalancePre).minus(wethAmount).toString()));
    expect(user2UsdcBalancePost).to.equal(
        parseEther(
            Big(user2UsdcBalancePre)
                .plus(
                    Big(wethAmount).minus(takerFeeAmount)
                        .times(spotRate)
                        .div(Big(10).pow(18))).toString()))

    let wait = () => {
        return new Promise((resolve, reject) => {

            let timeOutId = setTimeout(() => {
                return resolve("Success")
            }, 15000)
        })
    }
    let res = await wait()

});

it(`cancelled  order `, async () => {



    let exTxn = await spot.connect(user1).cancelOrder(
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
    let data = await Order.findOne({ signature: signatures[0] }).lean()! as ifOrderCreated;
    expect(data).to.be.an('object')
    expect(data).not.to.be.null;
    expect(data.cancelled).to.equal(true)

})*/

});





