import { sentry } from "../../app";
import { PairCreated, Token } from "../db";






export async function handleMinTokenAmountSet(data: any){

    try{
        const token =  data[0].toLocaleLowerCase();
        const minAMount = data[1].toString();

        await Token.findOneAndUpdate(
            {id: token, active: true},
            {$set:{minTokenAmount: minAMount}}
        );

        let pairs = await PairCreated.find({token0: token, active: true}).lean();
        
        pairs.forEach(async (x)=>{
            await PairCreated.findOneAndUpdate(
                {_id: x._id},
                {$set:{minToken0Order: minAMount}}
            )
        });

        console.log(`Min token amount updated token = ${token}, minAmount = ${minAMount}`)

    }
    catch(error){

        console.log("Error @ handleMinTokenAmountSet", error);
        // sentry.captureException(error)
    }
}