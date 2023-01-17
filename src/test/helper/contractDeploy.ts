//@ts-ignore
import hre from "hardhat";
import fs from "fs";
import {  getTestConfig } from "./addresses";

process.chdir('../')
//@ts-ignore
const ethers = hre.ethers;
const ExchangeContract = JSON.parse((fs.readFileSync(process.cwd() + "/contracts/artifacts/contracts/Exchange.sol/Exchange.json")).toString());
const ERC20 = JSON.parse((fs.readFileSync(process.cwd() + "/contracts/artifacts/contracts/mocks/test/ERC20.sol/TestERC20.json")).toString());
const Lever = JSON.parse((fs.readFileSync(process.cwd() + "/contracts/artifacts/contracts/lending/Lever.sol/Lever.json")).toString());
const LendingMarket = JSON.parse((fs.readFileSync(process.cwd() + "/contracts/artifacts/contracts/lending/LendingMarket.sol/LendingMarket.json")).toString());
const Zexe = JSON.parse((fs.readFileSync(process.cwd() + "/contracts/artifacts/contracts/token/ZEXE.sol/ZEXE.json")).toString());
const SimplePriceOracle = JSON.parse((fs.readFileSync(process.cwd() + "/contracts/artifacts/contracts/lending/PriceOracle.sol/SimplePriceOracle.json")).toString());
const JumpRateModelV2 = JSON.parse((fs.readFileSync(process.cwd() + "/contracts/artifacts/contracts/lending/InterestRateModel.sol/JumpRateModelV2.json")).toString());
const Multicall2 = JSON.parse((fs.readFileSync(process.cwd() + "/contracts/artifacts/contracts/libraries/Multicall2.sol/Multicall2.json")).toString());


// bytecode
const exchangeBytecode = ExchangeContract["bytecode"];
const erc20Bytecode = ERC20["bytecode"]
const leverBytecode = Lever["bytecode"]
const zexeBytecode = Zexe["bytecode"]
const lendingMarketBytecode = LendingMarket["bytecode"]
const simplePriceOracleBytecode = SimplePriceOracle["bytecode"]
const jumpRateModelV2Bytecode = JumpRateModelV2["bytecode"]
const multicall2Bytecode = Multicall2["bytecode"]


//abi
const exchangeABI = ExchangeContract["abi"]
const erc20ABI = ERC20["abi"]
const leverABI = Lever["abi"]
const zexeABI = Zexe["abi"]
const lendingMarketABI = LendingMarket["abi"]
const simplePriceOracleABI = SimplePriceOracle["abi"]
const jumpRateModelV2ABI = JumpRateModelV2["abi"]
const multicallABI = Multicall2["abi"]
// console.log(ERC20Bytecode)

// console.log(multicall2Bytecode)


export async function deploy(deployerAddress: string) {

    /* -------------------------------------------------------------------------- */
    /*                                  Exchange                                  */
    /* -------------------------------------------------------------------------- */
    const Exchange = await hre.ethers.getContractFactory(exchangeABI, exchangeBytecode);
    let exchange;


    exchange = await Exchange.deploy()
    await exchange.deployed();
    await exchange.initialize(getTestConfig("name"), getTestConfig("version"), deployerAddress, deployerAddress)


    /* -------------------------------------------------------------------------- */
    /*                                 ZEXE Token                                 */
    /* -------------------------------------------------------------------------- */
    const ZEXE = await hre.ethers.getContractFactory(zexeABI, zexeBytecode);
    const zexe = await ZEXE.deploy();
    await zexe.deployed();

    /* -------------------------------------------------------------------------- */
    /*                                    Lever                                   */
    /* -------------------------------------------------------------------------- */
    const Lever = await hre.ethers.getContractFactory(leverABI, leverBytecode);
    const lever = await Lever.deploy(exchange.address, zexe.address);
    await lever.deployed();

    /* -------------------------------------------------------------------------- */
    /*                                    Tokens                                  */
    /* -------------------------------------------------------------------------- */
    const ERC20 = await hre.ethers.getContractFactory(erc20ABI, erc20Bytecode);
    const LendingMarket = await hre.ethers.getContractFactory(lendingMarketABI, lendingMarketBytecode);
    const PriceOracle = await hre.ethers.getContractFactory(simplePriceOracleABI, simplePriceOracleBytecode);
    const InterestRateModel = await hre.ethers.getContractFactory(jumpRateModelV2ABI, jumpRateModelV2Bytecode);
    const irm = await InterestRateModel.deploy(inEth('0.05'), inEth('0.25'), inEth('0.05'), inEth('0.90'), '0x22F221b77Cd7770511421c8E0636940732016Dcd');
    await irm.deployed();

    const oracle = await PriceOracle.deploy();
    await lever._setPriceOracle(oracle.address);

    const eth = await ERC20.deploy("Ethereum", "ETH");
    await eth.deployed();
    const ceth = await LendingMarket.deploy();
    await ceth.deployed();
    await ceth.initialize(eth.address, lever.address, irm.address, inEth('2'), 'Ethereum', 'ETH', 18);


    await oracle.setUnderlyingPrice(ceth.address, inEth('1124'));
    await lever._supportMarket(ceth.address)
    await lever._setCollateralFactor(ceth.address, inEth('0.92'));
    await exchange.enableMarginTrading(eth.address, ceth.address);
    await exchange.setMinTokenAmount(eth.address, inEth('0.1'));

    const btc = await ERC20.deploy("Bitcoin", "BTC");
    await btc.deployed();
    const cbtc = await LendingMarket.deploy();
    await cbtc.deployed();
    await cbtc.initialize(btc.address, lever.address, irm.address, inEth('2'), 'Bitcoin', 'BTC', 18);



    await oracle.setUnderlyingPrice(cbtc.address, inEth('16724'));
    await lever._supportMarket(cbtc.address)
    await lever._setCollateralFactor(cbtc.address, inEth('0.92'));
    await exchange.enableMarginTrading(btc.address, cbtc.address);
    await exchange.setMinTokenAmount(btc.address, inEth('0.001'));

    const usdc = await ERC20.deploy("USD Coin", "USDC");
    await usdc.deployed();
    const cusdc = await LendingMarket.deploy();
    await cusdc.deployed();
    cusdc.initialize(usdc.address, lever.address, irm.address, inEth('10'), 'USD Coin', 'USDC', 18);

    let wait = () => {
        return new Promise((resolve, reject) => {

            let timeOutId = setTimeout(() => {
                return resolve("Success")
            }, 2000)
        })
    }

    let res = await wait()
    // error after this line
    await oracle.setUnderlyingPrice(cusdc.address, inEth('1'));
    console.log("deployer", deployerAddress);
    await lever._supportMarket(cusdc.address)

    await lever._setCollateralFactor(cusdc.address, inEth('0.92'));

    await exchange.enableMarginTrading(usdc.address, cusdc.address);
    await exchange.setMinTokenAmount(usdc.address, inEth('10'));

    await zexe.mint(lever.address, ethers.utils.parseEther('10000000000000'));
    await lever._setCompSpeeds(
        [cusdc.address, cbtc.address, ceth.address],
        [ethers.utils.parseEther("0.0000001"), ethers.utils.parseEther("0.000001"), ethers.utils.parseEther("0.001")],
        [ethers.utils.parseEther("0.00001"), ethers.utils.parseEther("0.0001"), ethers.utils.parseEther("0.00001")]
    )

    /* -------------------------------------------------------------------------- */
    /*                                    Multicall                                  */
    /* -------------------------------------------------------------------------- */

    const Multicall = await hre.ethers.getContractFactory(multicallABI, multicall2Bytecode);
    const multicall = await Multicall.deploy();
    await multicall.deployed();



    // update deployment 
    let Deployments = JSON.parse((fs.readFileSync(process.cwd() + "/src/test/helper/deployment/deployment.json")).toString());


    Deployments["contracts"]["Exchange"]["address"] = exchange.address;
    Deployments["contracts"]["Multicall2"]["address"] = multicall.address;
    Deployments["contracts"]["Lever"]["address"] = lever.address;
    Deployments["contracts"]["BTC"]["address"] = btc.address;
    Deployments["contracts"]["USDC"]["address"] = usdc.address;
    Deployments["contracts"]["ETH"]["address"] = eth.address;
    fs.writeFileSync(
		process.cwd() + "/src/test/helper/deployment/deployment.json",
		JSON.stringify(Deployments, null, 2)
	);
   
    return { exchange, lever, usdc, cusdc, btc, cbtc, eth, ceth, oracle, irm, multicall };
}

const inEth = (amount: string) => ethers.utils.parseEther(amount);