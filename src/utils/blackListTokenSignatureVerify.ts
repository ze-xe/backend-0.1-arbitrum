import { ethers } from "ethers";
import path from "path";
import { getExchangeAddress, getVersion } from "../helper/chain";
import { getConfig } from "../helper/constant";







require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });

export function blackListTokenSignatureValidation(signature: string, value: object, chainId: string): (boolean) {
    try {

        const domain = {
            name: getConfig("name"),
            version: getVersion(process.env.NODE_ENV!),
            chainId: chainId,
            verifyingContract: getExchangeAddress(chainId),
        };

        // The named list of all type definitions
        const types = {
            Request: [
                { name: 'token', type: 'address' },
                { name: 'blackList', type: 'uint8' },
            ]
        };

        const digest: string = ethers.utils._TypedDataEncoder.hash(domain, types, value).toLowerCase();

        const signatureAddress: string = ethers.utils.recoverAddress(digest, signature).toLowerCase();

        if (process.env.ADMIN_ADD! as string == signatureAddress) {
            return true;
        }

        return false;

    }
    catch (error: any) {
        console.log("Error @ blackListTokenSignatureValidation", error.message);
        return false
    }
}