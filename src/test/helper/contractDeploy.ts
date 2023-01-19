//@ts-ignore
import hre from "hardhat";
import fs from "fs";
import { getTestConfig } from "./addresses";
import path from "path";




const ethers = hre.ethers;




export async function deploy(deployerAddress: string) {

    /* -------------------------------------------------------------------------- */
    /*                                  Exchange                                  */
    /* -------------------------------------------------------------------------- */
    const exchnageDep = getDeployment("Exchange")
    const Exchange = await hre.ethers.getContractFactory(exchnageDep[0], exchnageDep[1]);
    let exchange;


    exchange = await Exchange.deploy()
    await exchange.deployed();
    await exchange.initialize(getTestConfig("name"), getTestConfig("version"), deployerAddress, deployerAddress)


    /* -------------------------------------------------------------------------- */
    /*                                 ZEXE Token                                 */
    /* -------------------------------------------------------------------------- */
    const zexeDep = getDeployment("ZEXE")
    const ZEXE = await hre.ethers.getContractFactory(zexeDep[0], zexeDep[1]);
    const zexe = await ZEXE.deploy();
    await zexe.deployed();

    /* -------------------------------------------------------------------------- */
    /*                                    Lever                                   */
    /* -------------------------------------------------------------------------- */
    const leverDep = getDeployment("Lever")
    const Lever = await hre.ethers.getContractFactory(leverDep[0], leverDep[1]);
    const lever = await Lever.deploy(exchange.address, zexe.address);
    await lever.deployed();

    /* -------------------------------------------------------------------------- */
    /*                                    Tokens                                  */
    /* -------------------------------------------------------------------------- */
    const erc20Dep = getDeployment("TestERC20")
    const ERC20 = await hre.ethers.getContractFactory(erc20Dep[0], erc20Dep[1]);
    const lendingMarketDep = getDeployment("LendingMarket")
    const LendingMarket = await hre.ethers.getContractFactory(lendingMarketDep[0], lendingMarketDep[1]);
    const priceOracleDep = getDeployment("SimplePriceOracle")
    const PriceOracle = await hre.ethers.getContractFactory(priceOracleDep[0], priceOracleDep[1]);
    const nterestRateModelDep = getDeployment("JumpRateModelV2")
    const InterestRateModel = await hre.ethers.getContractFactory(nterestRateModelDep[0], nterestRateModelDep[1]);
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
    const multicallDep = getDeployment("Multicall2")
    const Multicall = await hre.ethers.getContractFactory(multicallDep[0], multicallDep[1]);
    const multicall = await Multicall.deploy();
    await multicall.deployed();



    // update deployment 
    let Deployments = JSON.parse((fs.readFileSync(__dirname + "/deployment/deployment.json")).toString());

    let name = ["Exchange", "Multicall2", "Lever", "BTC", "USDC", "ETH"];
    let contract = [exchange, multicall, lever, btc, usdc, eth];

    for (let i in name) {
        Deployments["contracts"][name[i]]["address"] = contract[i].address
    }

    fs.writeFileSync(
        __dirname + "/deployment/deployment.json",
        JSON.stringify(Deployments, null, 2)
    );

    return { exchange, lever, usdc, cusdc, btc, cbtc, eth, ceth, oracle, irm, multicall };
}

const inEth = (amount: string) => ethers.utils.parseEther(amount);



function getDeployment(name: string) {

    let string = "empty"
    switch (name) {
        case "Exchange":
            string = '/Exchange.sol/Exchange.json'
            break;
        case "TestERC20":
            string = '/mocks/test/ERC20.sol/TestERC20.json'
            break;
        case "Lever":
            string = '/lending/Lever.sol/Lever.json'
            break;
        case "LendingMarket":
            string = '/lending/LendingMarket.sol/LendingMarket.json'
            break;
        case "ZEXE":
            string = '/token/ZEXE.sol/ZEXE.json'
            break;
        case "SimplePriceOracle":
            string = '/lending/PriceOracle.sol/SimplePriceOracle.json'
            break;
        case "JumpRateModelV2":
            string = '/lending/InterestRateModel.sol/JumpRateModelV2.json'
            break;
        case "Multicall2":
            string = '/libraries/Multicall2.sol/Multicall2.json'
            break;

    }
    if (string != "empty") {
        let deployment = JSON.parse((fs.readFileSync(path.join(__dirname, '../../../contracts/artifacts/contracts' + string))).toString());
        return [deployment["abi"], deployment["bytecode"]]
    }
    console.log("request is not valid")
    return ["request is not valid"]

}

// console.log(getDeployment("Exchange"))
