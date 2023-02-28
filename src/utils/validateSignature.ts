

import { ethers } from "ethers";
import { getVersion } from "../helper/chain";
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
export function validateSignature(maker: string, signature: string, value: any, chainId: string, domainData: any): (string | null) {
    try {
        require("dotenv").config()
       
        const domain = {
            name: domainData.name,
            version: domainData.version,
            chainId: chainId,
            verifyingContract: domainData.spotAddress,
        };

        // The named list of all type definitions
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
        // console.log("value from signature", value, signature);
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