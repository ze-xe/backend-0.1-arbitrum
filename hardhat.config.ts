import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"
import "@nomiclabs/hardhat-etherscan";
import '@openzeppelin/hardhat-upgrades';

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true
    },
  },
 
  // networks: {
  //   goerli: {
  //     url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
  //     accounts: [`0x${process.env.PRIVATE_KEY}`],
  //   },
  //   harmonyTestnet: {
  //     url: `https://api.s0.b.hmny.io/`,
  //     accounts: [`0x${process.env.PRIVATE_KEY}`],
  //   },
  //   arbitrumGoerli: {
  //     url: `https://arb-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  //     accounts: [`0x${process.env.PRIVATE_KEY}`],
  //     gasPrice: 1600000000
  //   }
  // },
 
};

export default config;
