
import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import { getVersion } from "../../helper/chain";
use(chaiHttp);






require("dotenv").config()

// main server must be close 

describe("Testing get apis", async () => {

    // requirements
    let chainId = "421613"
    let pairId = "";
    let user = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    let token = ""
    before(async () => {
        //     require('../../../app')
    });

    after((done) => {
        // require('../../../app').stop()
        done()
    })

    it(`testing /pair/allpairs`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/pair/allpairs`)
            .query({ chainId: chainId })

        expect(res).to.have.status(200);
        expect(res.body.data[0].id).not.to.be.null;
        pairId = res.body.data[0].id
        token = res.body.data[0].tokens[0].id
        // console.log(res.body)

    });


    it(`testing /user/orders/placed/:maker/pair/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/user/orders/placed/${user}/pair/${pairId}`)
            .query({ chainId: chainId })

        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data).to.have.an('array');
    
    });


    it(`testing /user/orders/history/:taker/pair/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/user/orders/history/${user}/pair/${pairId}`)
            .query({ chainId: chainId })

        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data).to.have.an('array');
    
    });


    it(`testing /user/orders/cancelled/:maker/pair/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/user/orders/cancelled/${user}/pair/${pairId}`)
            .query({ chainId: chainId })

        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data).to.have.an('array');
    
    });


    it(`testing /user/orders/cancelled/:maker/pair/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/user/orders/cancelled/${user}/pair/${pairId}`)
            .query({ chainId: chainId })

        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data).to.have.an('array');
    
    });


    it(`testing /inorder/balance/:maker/token/:token`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/user/orders/cancelled/${user}/pair/${token}`)
            .query({ chainId: chainId })

        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data).to.have.an('array');
    
    });

});





