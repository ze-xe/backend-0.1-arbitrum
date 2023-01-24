import * as sentry from "@sentry/node";
import { Pair, Token } from "../DB/db";






export async function handleMinTokenAmountSet(data: any){

    try{
        const token =  data[0].toLocaleLowerCase();
        const minTokenAmount = data[1].toString();

        await Token.findOneAndUpdate(
            {id: token, active: true},
            {$set:{minTokenAmount: minTokenAmount}}
        );

        let pairs = await Pair.find({token0: token, active: true}).lean();
        
        pairs.forEach(async (x)=>{
            await Pair.findOneAndUpdate(
                {_id: x._id},
                {$set:{minToken0Order: minTokenAmount}}
            )
        });

        console.log(`Min token amount updated token = ${token}, minAmount = ${minTokenAmount}`)

    }
    catch(error){
        console.log("Error @ handleMinTokenAmountSet", error);
        sentry.captureException(error)
    }
}