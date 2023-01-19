

import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import { connect } from "../../DB/db";
use(chaiHttp);
import { getVersion } from "../../helper/chain";
import { } from "../../helper/constant";



describe('Testing Pair Api', () => {

    before(async () => {
        await connect()
    });
    /*
      * Test the /GET route
      */
    describe('Get(/pair/allpairs)', async () => {

        it('it should  have atleast a pair', async () => {

            let res = await request("http://localhost:3010")
                .get(`/v/${getVersion(process.env.NODE_ENV!)}/pair/allpairs?chainId=421613`)
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).not.to.have.lengthOf(0);
            expect(res.body.status).to.be.equal(true);
        });


        it('it should send error for not providing chainId', async () => {
            let res = await request("http://localhost:3010")
                .get(`/v/${getVersion(process.env.NODE_ENV!)}/pair/allpairs`)

            expect(res).to.have.status(400);
            expect(res.body.status).to.be.equal(false);
            expect(res.body).to.be.an('object');
            expect(res.body.error).to.have.string('chainId is required');
        });


    });

});