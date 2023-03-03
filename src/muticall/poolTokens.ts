

import { BigNumber, ethers } from "ethers";
import { User, Order } from "../DB/db";
import Big from "big.js";
import { getProvider, getInterface, getABI } from "../utils/utils";
import { ifOrderCreated, ifUserPosition, orderSignature } from "../helper/interface";
import * as sentry from "@sentry/node";
import { getMulticallAddress } from "../helper/chain";
import { Action } from "../controllers/order/helper/marginValidationUserPosition";







// export async function _getPoolTokensMultiBalance(aToken: string, vToken: string, addresses: string[], chainId: string,) {

//     try {

//         const multicall: ethers.Contract = new ethers.Contract(
//             getMulticallAddress(chainId),
//             getABI("Multicall2"),
//             getProvider(chainId)
//         );

//         const itf: ethers.utils.Interface = getInterface(getABI("AToken"));
//         const itf1: ethers.utils.Interface = getInterface(getABI("VToken"));

//         let input: any = [];
//         for (let ele of addresses) {
//             input.push([
//                 aToken,
//                 itf.encodeFunctionData("balanceOf", [ele])
//             ])
//         }
//         for (let ele of addresses) {
//             input.push([
//                 vToken,
//                 itf1.encodeFunctionData("balanceOf", [ele])
//             ])
//         };

//         const resp: any = await multicall.callStatic.aggregate(input);

//         let aTokenBalance: Big = Big(0);
//         let vTokenBalance: Big = Big(0);
//         for (let i = 0; i < resp[1].length; i++) {

//             let balance = BigNumber.from(resp[1][i]).toString();
//             if (i < resp[1].length / 2) {
//                 aTokenBalance = Big(aTokenBalance).plus(balance);
//             }
//             else {
//                 vTokenBalance = Big(vTokenBalance).plus(balance);
//             }
//         }
//         return { aTokenBalance, vTokenBalance };
//     } catch (error) {
//         sentry.captureException(error);
//         console.log("Error @ getMultiBalance", error);
//         return null
//     }
// };


/**
 * @dev this function will use to get balance of aToken[], vToken[], of addresses[]
 * @notice its check if maker has sufficeint token or not, and remove invalid data, update as inActive in DB
 * @param {*} aToken ([string]) addresses of aToken
 * @param {*} vToken ([string]) addresses of vToken
 * @param {*} addresses ([string]) addresses of user
 * @param {*} chainId (string) numeric chainId
 * @returns ({dataAToken:[[aToken,balance], dataVToken:[[vToken,balance]})
 */
export async function getPoolTokensMultiBalance(aToken: string[], vToken: string[], addresses: string[], chainId: string,) {

    try {

        const multicall: ethers.Contract = new ethers.Contract(
            getMulticallAddress(chainId),
            getABI("Multicall2"),
            getProvider(chainId)
        );

        const itf: ethers.utils.Interface = getInterface(getABI("AToken"));
        const itf1: ethers.utils.Interface = getInterface(getABI("VToken"));

        let input: any = [];

        for (let i in aToken) {

            for (let j in addresses) {
                input.push([
                    aToken[i],
                    itf.encodeFunctionData("balanceOf", [addresses[j]])
                ])
            }

        };
        for (let i in vToken) {

            for (let j in addresses) {

                input.push([
                    vToken[i],
                    itf.encodeFunctionData("balanceOf", [addresses[j]])
                ])
            }

        };

        const resp: any = await multicall.callStatic.aggregate(input);
        let aTokenBalance: Big = Big(0);
        let vTokenBalance: Big = Big(0);
        let dataAToken: any = [];
        let dataVToken: any = [];
        let count = addresses.length;
        let j = 0;

        for (let i = 0; i < resp[1].length / 2; i++) {
          
            let balance = BigNumber.from(resp[1][i]).toString();
            aTokenBalance = Big(aTokenBalance).plus(balance);
            count--;
            if (count == 0) {
                count = addresses.length;
                dataAToken.push([aToken[j], aTokenBalance.toString()]);
                j++;
                aTokenBalance = Big(0)
            }
        }
        j = 0
        count = addresses.length;
        for (let i = resp[1].length / 2; i < resp[1].length; i++) {
            let balance = BigNumber.from(resp[1][i]).toString();
            vTokenBalance = Big(vTokenBalance).plus(balance);
            count--;
            if (count == 0) {
                count = addresses.length;
                dataVToken.push([vToken[j], vTokenBalance.toString()]);
                j++;
                vTokenBalance = Big(0)
            }
           
        }
        return { dataAToken, dataVToken };
    } catch (error) {
        sentry.captureException(error);
        console.log("Error @ getMultiBalance", error);
        return null
    }
};

