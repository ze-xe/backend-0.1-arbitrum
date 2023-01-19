

import { ethers } from "ethers";
import { getExchangeAddress, getVersion } from "../helper/chain";
import { getConfig } from "../helper/constant";




/**
 * @dev This function would validate order signatures
 * @notice verify signature
 * @param {*} maker (string) should be order creator's address 
 * @param {*} signature (string)
 * @param {*} value (object)
 * @param {*} chainId (string) numeric chainId
 * @returns digest will be id of order, or false
 */
export function validateSignature(maker: string, signature: string, value: object, chainId: string): (string | null) {
    try {
        require("dotenv").config()
        const domain = {
            name: getConfig("name"),
            version: getVersion(process.env.NODE_ENV!),
            chainId: chainId,
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

        const digest: string = ethers.utils._TypedDataEncoder.hash(domain, types, value).toLowerCase();

        const signatureAddress: string = ethers.utils.recoverAddress(digest, signature).toLowerCase();
        // console.log(maker, signatureAddress)
        if (maker == signatureAddress) {
            return digest;
        }

        return null;

    }
    catch (error: any) {
        console.log("Error @ validateSignature", error.message);
        return null
    }
}