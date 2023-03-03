import { UserPosition } from "../../DB/db";
import { errorMessage } from "../../helper/errorMessage";






export async function getUserPosition (req: any, res: any) {
    try{
        const maker = req.params.maker?.toLowerCase();
        const chainId= req.query.chainId;
        if(!chainId) {
            return res.status(400).send({status: false, error: errorMessage.CHAIN_ID_REQUIRED});
        }
        const getPosition = await UserPosition.findOne({id: maker, chainId: chainId}).lean();
        let data: any = [];
        if(getPosition) {
            data = [getPosition.position]
        }
        return res.status(200).send({status: true, data: data});
    }
    catch(error){
        console.log("Error @ getUserPosition", error)
    }
}