



import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import { ethers } from "ethers";
import { connect } from "../../db";
import { getExchangeAddress, getVersion } from "../../helper/chain";
import { ifOrderCreated } from "../../helper/interface";
import { getProvider } from "../../utils/utils";
import path from "path";
import { getConfig, getContractAddress } from "../../helper/constant";
use(chaiHttp);
require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });



describe("Limit Order => Mint token, create order, execute order, cancel order", async () => {

    // requirements
    let chainId = "421613"
    let provider = getProvider(chainId);
    let user1 = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80").connect(provider); //1 
    let signatures: any[] = [];
    let orders: any[] = [];

    before(async () => {
        // await connect()
    });


    it(`Add link address in blacklist`, async () => {

        const domain = {
            name: getConfig("name"),
            version: getVersion(process.env.NODE_ENV!),
            chainId: chainId.toString(),
            verifyingContract: getExchangeAddress(chainId),
        };

        // The named list of all type definitions
        const types = {
            Request: [
                { name: 'token', type: 'address' },
                { name: 'blackList', type: 'uint8' },
            ]
        };

        // The data to sign
        const value = {
            token: getContractAddress("LINK"),
            blackList: 0
        };

        orders.push(value);
        // sign typed data
        const storedSignature = await user1._signTypedData(
            domain,
            types,
            value
        );
        signatures.push(storedSignature);
        console.log([
            value, storedSignature
        ]);

        let res = await request("http://localhost:3010")
            .put(`/v/${getVersion(process.env.NODE_ENV!)}/pair/blacklist `)
            .send(
                {
                    "token": getContractAddress("LINK"),
                    "blackList": 0,
                    "signature": storedSignature.toLowerCase(),
                    "chainId": chainId
                }
            );


        console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.status).to.be.equal(true);
        expect(res.body).to.be.an('object');
        expect(res.body.message).to.have.string("Token Deactivate");

    });
    it(`Remove Linktoken from blacklist`, async () => {

        const domain = {
            name: getConfig("name"),
            version: getVersion(process.env.NODE_ENV!),
            chainId: chainId.toString(),
            verifyingContract: getExchangeAddress(chainId),
        };

        // The named list of all type definitions
        const types = {
            Request: [
                { name: 'token', type: 'address' },
                { name: 'blackList', type: 'uint8' },
            ]
        };

        // The data to sign
        const value = {
            token: getContractAddress("LINK"),
            blackList: 1
        };

        orders.push(value);
        // sign typed data
        const storedSignature = await user1._signTypedData(
            domain,
            types,
            value
        );
        signatures.push(storedSignature);
        // console.log([
        //     value, storedSignature
        // ]);

        let res = await request("http://localhost:3010")
            .put(`/v/${getVersion(process.env.NODE_ENV!)}/pair/blacklist `)
            .send(
                {
                    "token": getContractAddress("LINK"),
                    "blackList": 1,
                    "signature": storedSignature.toLowerCase(),
                    "chainId": chainId
                }
            );


        console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.status).to.be.equal(true);
        expect(res.body).to.be.an('object');
        expect(res.body.message).to.equal("Token Activate")


    });




});





