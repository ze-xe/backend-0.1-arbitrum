import mongoose from "mongoose";

const UserPositionSchema = new mongoose.Schema({

    id: String,
    token: String,
    inOrderBalance: {type:String,default: '0'},
    chainId: String

},
    { timestamps: true }
);


export default UserPositionSchema;
