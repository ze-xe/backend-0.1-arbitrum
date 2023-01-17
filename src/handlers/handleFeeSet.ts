import { sentry } from "../../app";
import { Sync } from "../DB/db";



export async function handleFeesSet(data: any){

    try{
        let makerFee = data[0].toString();
        let takerFee = data[1].toString();

       let updateFee = await Sync.findOneAndUpdate(
        {},
        {$set:{makerFee: makerFee, takerFee: takerFee}},
        {upsert: true}
       );

       console.log(`Fees Set updated maker ${makerFee}, taker ${takerFee}`);

    }
    catch(error){
        console.log("Error @ handleFeesSet", error);
        sentry.captureException(error)
    }

}