

// // import { expect } from 'chai';
// // import hre from 'hardhat';
// import { Contract } from 'ethers';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { deploy } from '../scripts/deploy';
// import { getExchangeABI } from '../utils';

// const ethers = hre.ethers;
// const web3 = require('web3');
// // const toWei = (x: { toString: () => any }) => web3.utils.toWei(x.toString());



// describe('zexe', function () {
//     let usdc, btc, exchange, vault;
//     let owner, user1, user2, user3, user4, user5, user6;
//     let orderIds = [];
//     let signatures = [];
//     let orders = []
//     usdc = Contract()
//     let provider = new ethers.providers.JsonRpcProvider('https://api.s0.b.hmny.io/');
//     exchange = new ethers.Contract("0x46A2b901fb23E9Cb6366D397352fC934D2a86D12", getExchangeABI(), provider)
//     btc = new ethers.Contract("0x842681C1fA28EF2AA2A4BDE174612e901D2b7827", getERC20ABI(), provider);
//     usdc = new ethers.Contract("0x842681C1fA28EF2AA2A4BDE174612e901D2b7827", getERC20ABI(), provider);
//     user1 = "0x103B62f68Da23f20055c572269be67fA7635f2fc";


//     it('mint 10 btc to user1, 1000000 usdt to user2', async () => {
//         const btcAmount = ethers.utils.parseEther('10');
//         await btc.mint(user1, btcAmount);
//         // approve for exchange
//         await btc.connect(user1).approve(exchange, btcAmount);

//         const usdcAmount = ethers.utils.parseEther('1000000');
//         await usdc.mint(user2.address, usdcAmount);
//         // approve for exchange
//         await usdt.connect(user2).approve(exchange.address, usdtAmount);
//     });

//     it('user1 creates limit order to sell 1 btc @ 19100', async () => {
//         const domain = {
//             name: 'zexe',
//             version: '1',
//             chainId: hre.network.config.chainId,
//             verifyingContract: exchange.address,
//         };

//         // The named list of all type definitions
//         const types = {
//             Order: [
//                 { name: 'maker', type: 'address' },
//                 { name: 'token0', type: 'address' },
//                 { name: 'token1', type: 'address' },
//                 { name: 'amount', type: 'uint256' },
//                 { name: 'buy', type: 'bool' },
//                 { name: 'salt', type: 'uint32' },
//                 { name: 'exchangeRate', type: 'uint216' }
//             ],
//         };

//         // The data to sign
//         const value = {
//             maker: user1.address,
//             token0: btc.address,
//             token1: usdt.address,
//             amount: ethers.utils.parseEther('1').toString(),
//             buy: false, // sell
//             salt: '12345',
//             exchangeRate: (19100 * 100).toString(),
//         };
//         orders.push(value);

//         // sign typed data
//         const storedSignature = await user1._signTypedData(
//             domain,
//             types,
//             value
//         );
//         signatures.push(storedSignature);

//         // get typed hash
//         const hash = ethers.utils._TypedDataEncoder.hash(domain, types, value);
//         orderIds.push(hash);
//         expect(await exchange.verifyOrderHash(storedSignature, value)).to.equal(hash);
//     });

//     it('buy user1s btc order @ 19100', async () => {
//         let user1BtcBalance = await btc.balanceOf(user1.address);
//         expect(user1BtcBalance).to.equal(ethers.utils.parseEther('10'));
//         let user2BtcBalance = await btc.balanceOf(user2.address);
//         expect(user2BtcBalance).to.equal(ethers.utils.parseEther('0'));

//         const btcAmount = ethers.utils.parseEther('5');
//         await exchange.connect(user2).executeLimitOrder(
//             signatures[0],
//             orders[0],
//             btcAmount
//         );

//         user1BtcBalance = await btc.balanceOf(user1.address);
//         expect(user1BtcBalance).to.equal(ethers.utils.parseEther('9'));
//         user2BtcBalance = await btc.balanceOf(user2.address);
//         expect(user2BtcBalance).to.equal(ethers.utils.parseEther('1'));
//     });
// });