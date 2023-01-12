import mongoose from "mongoose";

import path from 'path';
import { version } from "./helper/constant";

require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });

let a = version.split('.')
a.pop()
let _version = a.join("_")

export const backupConnection = mongoose.createConnection(process.env.MONGO_URL1+`backup-zexe-006?retryWrites=true&w=majority`! as string);
// export const backupConnection = mongoose.createConnection(process.env.MONGO_URL1 + `dev-backup-zexe-${_version}?retryWrites=true&w=majority`! as string);

import SyncSchema from "./schemas/Sync";
import PairCreatedSchema from "./schemas/PairCreated";
import OrderCreatedSchema from "./schemas/OrderCreated";
import OrderExecutedSchema from "./schemas/OrderExecuted";
import TokenSchema from "./schemas/Token";
import UserPositionSchema from "./schemas/UserPosition";




const OrderCreatedBackup: any = backupConnection.model("OrderCreated", OrderCreatedSchema);
const Sync = mongoose.model("Sync", SyncSchema);
const PairCreated = mongoose.model("PairCreated", PairCreatedSchema);
const OrderCreated = mongoose.model("OrderCreated", OrderCreatedSchema);
const OrderExecuted = mongoose.model("OrderExecuted", OrderExecutedSchema);
const Token = mongoose.model("Token", TokenSchema);
const UserPosition = mongoose.model("UserPosition", UserPositionSchema);





async function connect() {

    mongoose.connect(process.env.MONGO_URL+`dev-zexe-arbitrum006?retryWrites=true&w=majority`! as string)
    // mongoose.connect(process.env.MONGO_URL + `dev-zexe-${_version}?retryWrites=true&w=majority`! as string)
        .then(() => {
            console.log("MongoDb is connected")
        })
        .catch(err => {
            console.log(err)
        }
        );
    backupConnection
}






export { Sync, connect, PairCreated, OrderCreated, OrderExecuted, Token, UserPosition, OrderCreatedBackup };
