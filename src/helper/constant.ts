import path from "path";






const Decimals = {
    token: 18,
    amount: 18
};
require("dotenv").config({path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test')? ".env.test" : ".env")});

const ExchangeAddress = process.env.EXCHANGE_ADD! as string; 
const BtcAddress = "0x22f1311b6caE87A896a0B6915DAc39709e90E8b9";// orignal
// const BtcAddress = "0x728824E0534265f21917316733BE8936602154e7"; // ethereum
const UsdcAddress = "0x4ebEcD763ba4508565241043bB6E4592De3CCf14";
export const EthAddress = "0x728824E0534265f21917316733BE8936602154e7";
export const ZexeAddress = "0xD2061ca8645EEAbD2fa5931BeA458C09E660C93C";
export const leverAddress = "0xc683afe8F98b53e98C85A7BFd9ab8AAfcBF4f723";
export const cUsdcAddress = "0xdF5c119455D4d8A8dC3DCfeeaD1257d348DB4A12";
export const cBtcAddress = "0x6baE033D85c6CE8C8469F26E76a68E4cEfEaefaC";

export  { Decimals, ExchangeAddress, BtcAddress, UsdcAddress };