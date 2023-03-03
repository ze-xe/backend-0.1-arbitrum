
// import Big from "big.js";
// import { use, request } from "chai";
// import { expect } from "chai";
// import chaiHttp from "chai-http";
// import { ethers } from "ethers";
// import { connect, Order, OrderExecuted, Sync, User } from "../../DB/db";
// import { getExchangeAddress, getVersion } from "../../helper/chain";
// import { getProvider, parseEther } from "../../utils/utils";
// import { io } from "socket.io-client";
// import path from "path";
// import { EVENT_NAME } from "../../socketIo/socket.io";
// import { getConfig, getContract, } from "../../helper/constant";
// import { ifOrderCreated } from "../../helper/interface";
// use(chaiHttp);
// require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });
// const socket = io("http://localhost:3010");


// socket.on(EVENT_NAME.PAIR_ORDER, (data) => {
//     console.log("pairOrders", data)
// });

// socket.on(EVENT_NAME.PAIR_HISTORY, (data) => {
//     console.log("pairHistory", data)
// })

// describe("Limit Order => Mint token, create order, execute order, cancel order", async () => {

//     // requirements
//     let chainId = "421613"
//     let provider = getProvider(chainId);
//     let exchange = getContract("Spot", chainId);
//     let weth = getContract("WETH", chainId)
//     let usdc = getContract("USDC", chainId)
//     let user1 = new ethers.Wallet(process.env.PRIVATE_KEY1! as string).connect(provider); //2
//     let user2 = new ethers.Wallet(process.env.PRIVATE_KEY2! as string).connect(provider); //1
//     let signatures: any[] = [];
//     let orders: any[] = [];
//     let price = ethers.utils.parseEther('0.001').toString();
//     let txnId = "";
//     let orderId = "";
//     let nonce = Math.floor(Math.random() * 9000000);
//     let amount0 = ethers.utils.parseEther('1000').toString();
//     let amount1 = ethers.utils.parseEther('1').toString();
//     let expiry = ((Date.now() / 1000) + 7 * 24 * 60 * 60).toFixed(0)
//     let wethAmount = '';
//     let name = "zexe";
//     let version = "1"
//     let userInOrderPre = '0';
//     // console.log(weth);
//     before(async () => { //Before each test we empty the database   
//         // await mongoose.createConnection(process.env.MONGO_URL! as string).dropDatabase();
//         // httpServer
//         await connect()
//     });

//     it('mint 10 weth to user1, 200000 usdt to user2, approve exchange contract', async () => {

//         let user1wethBalancePre = (await weth.balanceOf(user1.address)).toString();
//         let user2UsdcBalancePre = (await usdc.balanceOf(user2.address)).toString();

//         const wethAmount = ethers.utils.parseEther('10').toString();
//         let tx1 = await weth.connect(user1).mint(user1.address, wethAmount);
//         let tx2 = await weth.connect(user2).mint(user2.address, wethAmount);

//         // approve for exchange
//         let approve = await weth.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
//         await weth.connect(user2).approve(exchange.address, ethers.constants.MaxUint256)

//         const usdcAmount = ethers.utils.parseEther('200000').toString();
//         let tx3 = await usdc.connect(user2).mint(user2.address, usdcAmount);
//         await usdc.connect(user1).mint(user1.address, usdcAmount);
//         // approve for exchange
//         let approve1 = await usdc.connect(user2).approve(exchange.address, ethers.constants.MaxUint256);
//         await usdc.connect(user1).approve(exchange.address, ethers.constants.MaxUint256);
//         await approve1.wait(1)
//         let user1wethBalancePost = (await weth.balanceOf(user1.address)).toString();
//         let user2UsdcBalancePost = (await usdc.balanceOf(user2.address)).toString();

//         // expect(user1wethBalancePost).to.equal(parseEther(Big(wethAmount).plus(user1wethBalancePre).toString()));
//         // expect(user2UsdcBalancePost).to.equal(parseEther(Big(usdcAmount).plus(user2UsdcBalancePre).toString()));
//     // });
//     // it('create cross position', async () => {
//     //     await exchange.connect(user1).createPosition([usdc.address, weth.address]);
//     //     // require(await spot.totalPositions(user1.address)).to.equal('1');
//     //     // require(await spot.position(user1.address, 0)).to.not.equal(ethers.constants.AddressZero);
//     // })


//     it(`user1 creates limit order to sell 1 weth @ 20000, check user inOrder Balance`, async () => {

//         const domain = {
//             name: name,
//             version: version,
//             chainId: chainId.toString(),
//             verifyingContract: exchange.address,
//         };


//         const types = {
//             Order: [
//                 { name: 'maker', type: 'address' },
//                 { name: 'token0', type: 'address' },
//                 { name: 'token1', type: 'address' },
//                 { name: 'token0Amount', type: 'uint256' },
//                 { name: 'token1Amount', type: 'uint256' },
//                 { name: 'leverage', type: 'uint256' },
//                 { name: 'price', type: 'uint256' },
//                 { name: 'expiry', type: 'uint256' },
//                 { name: 'nonce', type: 'uint256' },
//                 { name: 'action', type: 'uint256' },
//                 { name: 'position', type: 'uint256' }
//             ],
//         };

//         // The data to sign
//         const value = {
//             maker: user1.address.toLowerCase(),
//             token0: usdc.address.toLowerCase(),
//             token1: weth.address.toLowerCase(),
//             token0Amount: amount0,
//             token1Amount: amount1,
//             leverage: 5,
//             price: price,
//             expiry: expiry,
//             nonce: nonce,
//             action: 0,  // 2 for limit, 0 for open, 1 for close
//             position: 0 // for cross
//         };

//         orders.push(value);
//         // sign typed data
//         const storedSignature = await user1._signTypedData(
//             domain,
//             types,
//             value
//         );
//         signatures.push(storedSignature);
//         // console.log([
//         //     value, storedSignature
//         // ]);

//         let userPositionPre = await User.findOne({ token: weth.address.toLowerCase(), id: user1.address.toLowerCase() }).lean();

//         let userInOrder = userPositionPre?.inOrderBalance ?? '0';

//         let res = await request("http://localhost:3030")
//             .post(`/v/${getVersion(process.env.NODE_ENV!)}/order/create`)
//             .send(
//                 {
//                     "data": {
//                         maker: user1.address.toLowerCase(),
//                         token0: usdc.address.toLowerCase(),
//                         token1: weth.address.toLowerCase(),
//                         token0Amount: amount0,
//                         token1Amount: amount1,
//                         leverage: 5,
//                         price: price,
//                         expiry: expiry,
//                         nonce: nonce,
//                         action: 0,  // 2 for limit, 0 for open, 1 for close
//                         position: 0 // for cross
//                     },
//                     "signature": storedSignature.toLowerCase(),
//                     "chainId": chainId,
//                     spotAddress: exchange.address,
//                     name: name,
//                     version: version
//                 }
//             );

//         let userPositionPost = await User.findOne({ token: weth.address.toLowerCase(), id: user1.address.toLowerCase() }).lean()
//         console.log(res.body)
//         // expect(res).to.have.status(201);
//         // expect(res.body.status).to.be.equal(true);
//         // expect(res.body).to.be.an('object');
//         // expect(res.body.message).to.have.string('Order created successfully');
//         // expect(userPositionPost).not.to.be.null;
//         // expect(userPositionPost?.inOrderBalance).to.equal(Big(userInOrder).plus(amount0).toString())

//     });

//     // it(`find created order in data base`, async () => {

//     //     let data: any = await Order.findOne({ signature: signatures[0] }).lean();
//     //     expect(data).to.be.an('object');
//     //     expect(data.token0Amount).to.equal(amount0);
//     //     expect(data.maker).to.equal(user2.address.toLowerCase());
//     //     orderId = data.id
//     // })


//     it(`user2 buy user1s 1 weth order`, async () => {
//         // balances
//         // let user1wethBalancePre = weth.balanceOf(user1.address);
//         // let user2wethBalancePre = weth.balanceOf(user2.address);
//         // let user2UsdcBalancePre = usdc.balanceOf(user2.address);
//         // let user1UsdcBalancePre = usdc.balanceOf(user1.address);
//         // let promise = await Promise.all([user1wethBalancePre, user2wethBalancePre, user2UsdcBalancePre, user1UsdcBalancePre])
//         // user1wethBalancePre = promise[0].toString();
//         // user2wethBalancePre = promise[1].toString()
//         // user2UsdcBalancePre = promise[2].toString()
//         // user1UsdcBalancePre = promise[3].toString()

//         // inOrder Balance
//         // let userPositionPre = await User.findOne({ token: weth.address.toLowerCase(), id: user1.address.toLowerCase() }).lean();

//         // userInOrderPre = userPositionPre?.inOrderBalance ?? '0';
//         await usdc.connect(user2).increaseAllowance(exchange.address, (ethers.utils.parseEther('9200')));
//         // wethAmount = ethers.utils.parseEther(`1`).toString();
//         // console.log(orders[0], signatures[0])
//         const exTxn = await exchange.connect(user2).execute(
//             [orders[0]],
//             [signatures[0]],
//             usdc.address,
//             ethers.utils.parseEther('5000'),
//             weth.address,
//             ethers.constants.HashZero
//         );

//         await exTxn.wait(1)
//         // let user1wethBalancePost = weth.balanceOf(user1.address);
//         // let user1UsdcBalancePost = usdc.balanceOf(user1.address);
//         // let user2UsdcBalancePost = usdc.balanceOf(user2.address);
//         // let user2wethBalancePost = weth.balanceOf(user2.address);

//         // let promise1 = await Promise.all([user1wethBalancePost, user1UsdcBalancePost, user2UsdcBalancePost, user2wethBalancePost]);
//         // user1wethBalancePost = promise1[0].toString();
//         // user1UsdcBalancePost = promise1[1].toString();
//         // user2UsdcBalancePost = promise1[2].toString();
//         // user2wethBalancePost = promise1[3].toString();

//         // let fee = await Sync.findOne().lean()! as any;
//         // let makerFeeAmount = Big(fee?.makerFee).div(1e18).times(wethAmount);
//         // let takerFeeAmount = Big(Big(fee.takerFee).div(1e18)).times(Big(wethAmount));

//         // expect(user1wethBalancePost).to.equal(parseEther(Big(user1wethBalancePre).minus(wethAmount).toString()));
//         // expect(user1UsdcBalancePost).to.equal(parseEther(
//         //     Big(user1UsdcBalancePre)
//         //         .plus((Big(wethAmount)
//         //             .minus(makerFeeAmount))
//         //             .times(exchangeRate)
//         //             .div(Big(10).pow(18))).toString()
//         // ));
//         // expect(user2wethBalancePost).to.equal(parseEther(Big(user2wethBalancePre).plus(Big(wethAmount).minus(takerFeeAmount)).toString()))
//         // expect(user2UsdcBalancePost).to.equal(parseEther(
//         //     Big(user2UsdcBalancePre)
//         //         .minus(Big(wethAmount)
//         //             .times(exchangeRate)
//         //             .div(Big(10).pow(18))).toString()
//         // ));


//         // let wait = () => {
//         //     return new Promise((resolve, reject) => {

//         //         let timeOutId = setTimeout(() => {
//         //             return resolve("Success")
//         //         }, 15000)

//         //         socket.on(EVENT_NAME.PAIR_HISTORY, (data) => {
//         //             clearTimeout(timeOutId)
//         //             return resolve("Success")
//         //         })
//         //     })
//         // }

//         // let res = await wait()
//         // expect(res).to.equal("Success")

//         await exTxn.wait(1).then(async (resp: any) => {

//             txnId = resp.transactionHash

//         })
//     });

//     // it("cancel Order", async ()=>{

//     //     await exchange.connect(user1).cancelOrder(
//     //         orders[0],
//     //         signatures[0]
//     //     )
//     // })

//         /*
//     it(`find executed Order, check inOrderBalance`, async () => {
//         // console.log("txnId=",txnId, "orderId", orderId)
//         let executeOrder = await OrderExecuted.findOne({ id: orderId }).lean();
//         let userPosition = await User.findOne({ id: user1.address.toLowerCase(), token: weth.address.toLowerCase() }).lean()! as any;
//         let orderCreated = await Order.findOne({ id: orderId }).lean()! as any;

//         expect(orderCreated?.balanceAmount).to.equal(Big(orderCreated.amount).minus(wethAmount).toString())
//         expect(executeOrder).not.to.be.null;
//         expect(executeOrder?.fillAmount).to.equal(wethAmount);
//         expect(executeOrder?.exchangeRate).to.equal(exchangeRate);
//         expect(userPosition).not.to.be.null;
//         expect(userPosition?.inOrderBalance).to.equal(Big(userInOrderPre).minus(wethAmount).toString())

//     })




//     it(`user1 cancell order 0.2 weth, check order, inOrderbalance `, async () => {

//         let userPositionPre = await User.findOne({ id: user1.address.toLowerCase(), token: weth.address.toLowerCase() }).lean()

//         let exTxn = await exchange.connect(user1).cancelOrder(
//             signatures[0],
//             orders[0],
//             { gasLimit: "100000000" }
//         )

//         await exTxn.wait(1);

//         let wait = () => {
//             return new Promise((resolve, reject) => {

//                 let timeOutId = setTimeout(() => {
//                     return resolve("Success")
//                 }, 15000)

//                 socket.on(EVENT_NAME.CANCEL_ORDER, (data) => {
//                     clearTimeout(timeOutId)
//                     return resolve("Success")
//                 })
//             })
//         }
//         let res = await wait()
//         expect(res).to.equal("Success")
//         let order = await Order.findOne({ id: orderId }).lean();
//         let userPositionPost = await User.findOne({ id: user1.address.toLowerCase(), token: weth.address.toLowerCase() }).lean()
//         expect(order).to.be.an('object');
//         expect(order?.cancelled).to.equal(true);
//         expect(userPositionPost).to.be.an('object');
//         expect(userPositionPost?.inOrderBalance).to.equal(Big(userPositionPre?.inOrderBalance! as string).minus(Big(amount).minus(wethAmount)).toString());


//     })

//     // it(`it will get events`,(done)=>{

//     //     socket.on(EVENT_NAME.PAIR_HISTORY, (data) => {

//     //         expect(data).not.to.be.null;

//     //     })
//     //     socket.on(EVENT_NAME.PAIR_ORDER, (data) => {

//     //         expect(data).not.to.be.null;
//     //         done()
//     //     })

//     // })*/




// });





