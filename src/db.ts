import mongoose from "mongoose";

require("dotenv").config();




let backupConnection = mongoose.createConnection(process.env.MONGO_URL1);

import SyncSchema from "./schemas/Sync";
import PairCreatedSchema from "./schemas/PairCreated";
import OrderCreatedSchema from "./schemas/OrderCreated";
import OrderExecutedSchema from "./schemas/OrderExecuted";
import TokenSchema from "./schemas/Token";
import UserPositionSchema from "./schemas/UserPosition";



const OrderCreatedBackup = backupConnection.model("OrderCreated", OrderCreatedSchema);
const Sync = mongoose.model("Sync", SyncSchema);
const PairCreated = mongoose.model("PairCreated", PairCreatedSchema);
const OrderCreated = mongoose.model("OrderCreated", OrderCreatedSchema);
const OrderExecuted = mongoose.model("OrderExecuted", OrderExecutedSchema);
const Token = mongoose.model("Token", TokenSchema);
const UserPosition = mongoose.model("UserPosition", UserPositionSchema);





async function connect() {

    mongoose.connect(process.env.MONGO_URL)
        .then(() => console.log("MongoDb is connected"))
        .catch(err => console.log(err));
}






export { Sync, connect, PairCreated, OrderCreated, OrderExecuted, Token, UserPosition, backupConnection, OrderCreatedBackup };
