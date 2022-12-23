import mongoose from "mongoose";

require("dotenv").config();




let backupConnection = mongoose.createConnection(process.env.MONGO_URL1! as string);

import SyncSchema from "./schemas/Sync";
import PairCreatedSchema from "./schemas/PairCreated";
import OrderCreatedSchema from "./schemas/OrderCreated";
import OrderExecutedSchema from "./schemas/OrderExecuted";
import TokenSchema from "./schemas/Token";
import UserPositionSchema from "./schemas/UserPosition";
// import { MarginOrderCreatedSchema } from "./schemas/MarginOrderCreated"


const OrderCreatedBackup = backupConnection.model("OrderCreated", OrderCreatedSchema);
// const MarginOrderCreatedBackup = backupConnection.model("MarginOrderCreated", MarginOrderCreatedSchema);
const Sync = mongoose.model("Sync", SyncSchema);
const PairCreated = mongoose.model("PairCreated", PairCreatedSchema);
const OrderCreated = mongoose.model("OrderCreated", OrderCreatedSchema);
const OrderExecuted = mongoose.model("OrderExecuted", OrderExecutedSchema);
const Token = mongoose.model("Token", TokenSchema);
const UserPosition = mongoose.model("UserPosition", UserPositionSchema);
// const MarginOrderCreated = mongoose.model("MarginOrderCreated", MarginOrderCreatedSchema)




async function connect() {

    mongoose.connect(process.env.MONGO_URL! as string)
        .then(() => console.log("MongoDb is connected"))
        .catch(err => console.log(err));
}






export { Sync, connect, PairCreated, OrderCreated, OrderExecuted, Token, UserPosition, backupConnection, OrderCreatedBackup};
