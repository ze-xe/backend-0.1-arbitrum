import { sentry } from "../../app";
import { Sync } from "../db";



export async function handleFeesSet(data: any){

    try{
        let makerFee = data[0];
        let takerFee = data[1];

       await Sync.findOneAndUpdate(
        {},
        {$set:{makerFee: makerFee, takerFee: takerFee}}
       );

       console.log(`Fees Set updated maker ${makerFee}, taker ${takerFee}`);

    }
    catch(error){
        console.log("Error @ handleFeesSet", error);
        sentry.captureException(error)
    }

}