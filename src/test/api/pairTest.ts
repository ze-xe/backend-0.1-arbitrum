

import { use, request } from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import { ethers } from "ethers";
use(chaiHttp);
import mongoose from 'mongoose';
import { httpServer } from '../../../app';
import { backupConnection, connect } from '../../db';
import { BtcAddress, ExchangeAddress, UsdcAddress, version } from "../../helper/constant";
import { getERC20ABI, getExchangeABI, getProvider } from "../../utils/utils";


describe('Testing Pair Api', () => {

    before(async () => { //Before each test we empty the database   
        // await mongoose.createConnection(process.env.MONGO_URL! as string).dropDatabase();
        connect()
    });
    /*
      * Test the /GET route
      */
    describe('Get(/pair/allpairs)', async () => {

        it('it should  have atleast a pair', async () => {

            let res = await request("http://localhost:3010")
                .get(`/v/${version}/pair/allpairs?chainId=421613`)
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).not.to.have.lengthOf(0);
            expect(res.body.status).to.be.equal(true);
        });


        it('it should send error for not providing chainId', async () => {
            let res = await request("http://localhost:3010")
                .get(`/v/${version}/pair/allpairs`)

            expect(res).to.have.status(400);
            expect(res.body.status).to.be.equal(false);
            expect(res.body).to.be.an('object');
            expect(res.body.error).to.have.string('chainId is required');

        });

        it('it should create a limit order', async () => {

        })


    });

});