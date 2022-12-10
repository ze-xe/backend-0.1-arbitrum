import mongoose from "mongoose";

const UserPositionSchema = new mongoose.Schema({

    id: String,
    token: String,
    // balance: Number,
    inOrderBalance: String,
    chainId: String

},
    { timestamps: true }
);


export default UserPositionSchema;
