
import { connect, PairCreated, Token } from "../../db";
import { handleMinTokenAmountSet } from "../../handlers/handleMinTokenAmountSet";
import { BtcAddress } from "../helper/contractDeployment"
import { expect } from "chai";


// befor running this make sure btc token present in the database, and its piar created.

describe("handleMinTokenAmountSet, change its minToken and restore", async () => {
    let currentMinToken = "0"
    connect()
    it("it will change btc minToken and then restore to previous value", async () => {
       
        const btcAddress = BtcAddress;
        let minToken = "123456789";

        // get current minToken 

        let getTokenDetails = await Token.findOne({ id: btcAddress }).lean()! as any
        currentMinToken = getTokenDetails.minTokenAmount;
        let data = [btcAddress, minToken]
        await handleMinTokenAmountSet(data);

        // check new amount updated or not;

        let getTokenAfterUpdate = await Token.findOne({ _id: getTokenDetails._id }).lean()! as any

        expect(getTokenAfterUpdate.minTokenAmount).to.equal(minToken);

        // checking pairs updated where btc is token0;

        let getPairs = await PairCreated.find({ token0: btcAddress }).lean();

        getPairs.forEach((x) => {
            expect(x.minToken0Order == minToken)
        })

        // updating as per old value;

        await handleMinTokenAmountSet([btcAddress, currentMinToken])

        let getTokenAfterUpdate1 = await Token.findOne({ _id: getTokenDetails._id }).lean()! as any

        expect(getTokenAfterUpdate1.minTokenAmount).to.equal(currentMinToken);

        let getPairs1 = await PairCreated.find({ token0: btcAddress }).lean();

        getPairs1.forEach((x) => {
            expect(x.minToken0Order == currentMinToken)
        })


    });



})