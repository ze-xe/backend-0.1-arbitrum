
import { BigNumber, ethers } from "ethers";
import { Pair } from "../../../DB/db";
import { handleToken } from "../../../handlers/token";
import { ifPair } from "../../../helper/interface";
import * as sentry from "@sentry/node";
import Big from "big.js";
import { Action } from "./marginValidationUserPosition";




export async function getPairId(data: any, chainId: any) {
    try {

        let isPairExist: ifPair = await Pair.findOne({ token0: data.token0, token1: data.token1, chainId: chainId, active: true }).lean();
        let createPair: ifPair | any;

        if (!isPairExist) {
            // cheking for opposite pair
            let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [data.token1, data.token0]);
            let id = ethers.utils.keccak256(encoder);

            let isPairExist1: ifPair = await Pair.findOne({ id: id, active: true }).lean();;

            if (isPairExist1) {
                createPair = isPairExist1;
            }

            if (!isPairExist1) {
                let token0 = data.token0;
                let token1 = data.token1;
                if (data.token0Amount > data.token1Amount) {
                    [token0, token1] = [token1, token0];
                }
                let encoder = new ethers.utils.AbiCoder().encode(["address", "address"], [token0, token1]);
                let id = ethers.utils.keccak256(encoder);

                let token0Details = await handleToken(token0, chainId);
                let token1Details = await handleToken(token1, chainId);

                let marginEnabled = false;
                if (token0Details?.marginEnabled == true && token1Details?.marginEnabled == true) {
                    marginEnabled = true
                }
                let temp = {
                    id: id,
                    priceDecimals: 2,
                    minToken0Order: token0Details?.minToken0Amount,
                    price: '0',
                    priceDiff: '0',
                    token0: token0,
                    token1: token1,
                    chainId: chainId,
                    symbol: `${token0Details?.symbol}_${token1Details?.symbol}`,
                    marginEnabled: marginEnabled,
                    active: true
                }
                console.log(temp);
                createPair = await Pair.create(temp);

                console.log("Pair Created ", "T0 ", token0, "T1 ", token1, "CId ", chainId);

            }

        }
        let balanceAmount;
        let pair: string;
        let pairPrice;
        if (isPairExist) {
            pair = isPairExist.id?.toString();
            pairPrice = data.price;
            if (isPairExist.token0 == data.token1) {
                pairPrice = Big(1).div(Big(data.price).div(1e18)).mul(1e18).toString();
            }
            if (isPairExist.token0 == data.token0){

                if (data.action == Action.LIMIT) {
                    balanceAmount = data.token0Amount;
                }

                else if(data.action == Action.OPEN) {
                    balanceAmount = Big(data.token0Amount).mul(data.leverage-1).toString();
                }

                else if(data.action == Action.CLOSE) {
                    balanceAmount = data.token0Amount;
                }
            }
            else if(isPairExist.token0 == data.token1){
                if (data.action == Action.LIMIT) {
                    balanceAmount = data.token1Amount;
                }

                else if(data.action == Action.OPEN) {
                    balanceAmount = Big(data.token1Amount).mul(data.leverage-1).toString();
                }

                else if(data.action == Action.CLOSE) {
                    balanceAmount = data.token1Amount;
                }
            }
               

        }
        else {
            pair = createPair.id.toString();
            pairPrice = data.price;
            if (createPair.token0 == data.token1) {
                pairPrice = Big(1).div(Big(data.price).div(1e18)).mul(1e18).toString();
            }
            if (createPair.token0 == data.token0){

                if (data.action == Action.LIMIT) {
                    balanceAmount = data.token0Amount;
                }

                else if(data.action == Action.OPEN) {
                    balanceAmount = Big(data.token0Amount).mul(data.leverage-1).toString();
                }

                else if(data.action == Action.CLOSE) {
                    balanceAmount = data.token0Amount;
                }
            }
            else if(createPair.token0 == data.token1){
                if (data.action == Action.LIMIT) {
                    balanceAmount = data.token1Amount;
                }

                else if(data.action == Action.OPEN) {
                    balanceAmount = Big(data.token1Amount).mul(data.leverage-1).toString();
                }

                else if(data.action == Action.CLOSE) {
                    balanceAmount = data.token1Amount;
                }
            }
        }

        data["balanceAmount"] = balanceAmount.toString();
        return { pair: pair, pairPrice: pairPrice }
    }
    catch (error) {
        sentry.captureException(error)
        console.log(`error at getPairId`, error);
        return null
    }
}