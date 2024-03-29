
import { connect, Pair, Token } from "../../DB/db";
import { handleMinTokenAmountSet } from "../../handlers/handleMinTokenAmountSet";
import { expect } from "chai";
import { getContractAddress } from "../../helper/constant";


// befor running this make sure btc token present in the database, and its piar created.

describe("handleMinTokenAmountSet, change its minToken and restore", async () => {
    let currentMinToken = "0"
    // await connect();
    after(done => {
       
        done()
    })
    it("it will change btc minToken and then restore to previous value", async () => {
       
        const btcAddress = getContractAddress("BTC");
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

        let getPairs = await Pair.find({ token0: btcAddress, active: true }).lean();

        getPairs.forEach((x) => {
            expect(x.minToken0Order == minToken)
        })

        // updating as per old value;

        await handleMinTokenAmountSet([btcAddress, currentMinToken])

        let getTokenAfterUpdate1 = await Token.findOne({ _id: getTokenDetails._id }).lean()! as any

        expect(getTokenAfterUpdate1.minTokenAmount).to.equal(currentMinToken);

        let getPairs1 = await Pair.find({ token0: btcAddress, active: true }).lean();

        getPairs1.forEach((x) => {
            expect(x.minToken0Order == currentMinToken)
        })



    });



})