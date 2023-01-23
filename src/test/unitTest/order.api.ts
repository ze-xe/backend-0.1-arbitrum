
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

    });


    it(`testing /tokens`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/tokens`)
            .query({ chainId: chainId })

        expect(res).to.have.status(200);
        expect(res.body.data[0]).to.have.an("object")
        // console.log(res.body)

    });


    it(`testing /order/market/matched/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/order/market/matched/${pairId}`)
            .query({ chainId: chainId, orderType: 0, amount: 2e18 })

        expect(res).to.have.status(200);
        expect(res.body.data).to.have.an("array")
        // console.log(res.body)

    });


    it(`testing /order/limit/matched/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/order/limit/matched/${pairId}`)
            .query({ chainId: chainId, orderType: 0, amount: 2e18, exchangeRate: 20e18 })

        expect(res).to.have.status(200);
        expect(res.body.data).to.have.an("array")
        // console.log(res.body)

    });


    it(`testing /get/fee`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/get/fee`)
            .query({ chainId: chainId })

        expect(res).to.have.status(200);
        expect(res.body.data).to.have.an("array")
        // console.log(res.body)

    });




});





