import { CONSOLE_LEVELS } from "@sentry/utils";
import { connect, UserPosition } from "../DB/db";









export async function handleUserPosition(data: any, argument: any) {

    try {
       
        let maker = data[0].toLowerCase();
        let positionNumber = data[1];
        let positionAddress = data[2].toLowerCase();
        let pos = await UserPosition.findOne({ id: maker, chainId: argument.chainId }).lean();
        let position: any = {};
        if (pos && pos.position) {
            position = pos.position
        }
        let temp: any = {}
        temp["position"] = position;
        temp["position"][`${positionNumber}`] = positionAddress;

        await UserPosition.findOneAndUpdate(
            { id: maker, chainId: argument.chainId },
            {$set: temp},
            { upsert: true }
        )

        console.log(`Position created Maker : ${maker}, positionAddress: ${positionAddress}, ${positionNumber}`);
    }
    catch (error) {
        console.log("Error @ positionHandler", error);
    }
}
