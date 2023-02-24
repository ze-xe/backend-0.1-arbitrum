import mongoose from "mongoose";

import path from 'path';
import SyncSchema from "../schemas/Sync";
import PairSchema from "../schemas/Pair";
import OrderSchema from "../schemas/Order";
import OrderExecutedSchema from "../schemas/OrderFilled";
import TokenSchema from "../schemas/Token";
import UserSchema from "../schemas/User";
import { getVersion } from "../helper/chain";

// require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV?.includes('test') ? ".env.test" : ".env") });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
console.log(process.env.NODE_ENV, "ENV from DB")
let a = getVersion(process.env.NODE_ENV!).split('.')
a.pop()
let _version = a.join("_")

const backupConnection = mongoose.createConnection(process.env.MONGO_URL1 + `-backup-zexe-${_version}?retryWrites=true&w=majority`! as string);

const OrderCreatedBackup: any = backupConnection.model("Order", OrderSchema);
const Sync = mongoose.model("Sync", SyncSchema);
const Pair = mongoose.model("Pair", PairSchema);
const Order = mongoose.model("Order", OrderSchema);
const OrderExecuted = mongoose.model("OrderExecuted", OrderExecutedSchema);
const Token = mongoose.model("Token", TokenSchema);
const User = mongoose.model("User", UserSchema);





async function connect() {

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






export { Sync, connect, Pair, Order, OrderExecuted, Token, User, OrderCreatedBackup };
