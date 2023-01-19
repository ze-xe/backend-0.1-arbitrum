import { sentry } from "../../app";
import { Pair, Token } from "../DB/db";






export async function handleMinTokenAmountSet(data: any){

    try{
        const token =  data[0].toLocaleLowerCase();
        const minAMount = data[1].toString();

        await Token.findOneAndUpdate(
            {id: token, active: true},
            {$set:{minTokenAmount: minAMount}}
        );

        let pairs = await Pair.find({token0: token, active: true}).lean();
        
        pairs.forEach(async (x)=>{
            await Pair.findOneAndUpdate(
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