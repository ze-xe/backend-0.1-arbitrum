import mongoose from "mongoose";

import path from 'path';
import SyncSchema from "../schemas/Sync";
import PairCreatedSchema from "../schemas/PairCreated";
import OrderCreatedSchema from "../schemas/OrderCreated";
import OrderExecutedSchema from "../schemas/OrderExecuted";
import TokenSchema from "../schemas/Token";
import UserPositionSchema from "../schemas/UserPosition";
import { getVersion } from "../helper/chain";

// require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });
// require("dotenv").config()
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
console.log(process.env.NODE_ENV,"ENV")
console.log(process.env.MONGO_URL1)
let a = getVersion(process.env.NODE_ENV!).split('.')
a.pop()
let _version = a.join("_")

// export const backupConnection = mongoose.createConnection(process.env.MONGO_URL1+`test-backup-zexe?retryWrites=true&w=majority`! as string);
export const backupConnection = mongoose.createConnection(process.env.MONGO_URL1 + `-backup-zexe-${_version}?retryWrites=true&w=majority`! as string);



const OrderCreatedBackup: any = backupConnection.model("OrderCreated", OrderCreatedSchema);
const Sync = mongoose.model("Sync", SyncSchema);
const PairCreated = mongoose.model("PairCreated", PairCreatedSchema);
const OrderCreated = mongoose.model("OrderCreated", OrderCreatedSchema);
const OrderExecuted = mongoose.model("OrderExecuted", OrderExecutedSchema);
const Token = mongoose.model("Token", TokenSchema);
const UserPosition = mongoose.model("UserPosition", UserPositionSchema);





async function connect() {

    // mongoose.connect(process.env.MONGO_URL+`test-zexe-arbitrum006?retryWrites=true&w=majority`! as string)
    mongoose.connect(process.env.MONGO_URL + `-zexe-${_version}?retryWrites=true&w=majority`! as string)
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
