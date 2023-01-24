
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

    });

    it(`testing /orders/history/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/pair/orders/history/${pairId}`)
            .query({ chainId: chainId })
        // console.log(res.body)
        expect(res).to.have.status(200);
    });
    it(`testing /trading/status/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/pair/trading/status/${pairId}`)
            
        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data[0].interval).to.equal("_24hr");
    });
    it(`testing /orders/:pairId/:pairId`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/pair/orders/${pairId}`)
            .query({ chainId: chainId })
        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data.pair).to.equal(pairId);
    });
    it(`testing /newpairs`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/pair/newpairs`)
            .query({ chainId: chainId })
        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data[0]).to.have.an("object");
    });
    it(`testing /tranding`, async () => {

        let res = await request("http://localhost:3010")
            .get(`/v/${getVersion(process.env.NODE_ENV!)}/pair/tranding`)
            .query({ chainId: chainId })
        // console.log(res.body)
        expect(res).to.have.status(200);
        expect(res.body.data[0]).to.have.an("object");
    });

});





