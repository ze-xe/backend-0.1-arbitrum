import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({

    id: {type:String,required: true},
    name: {type:String,required: true},
    symbol:{type:String,required: true},
    price: Number,
    decimals:{type:String,required: true},
    chainId: {type:String,required: true},
    spot: {type:String,required: true},
    marginEnabled: { type: Boolean, default: true },
    cId: String,
    minTokenAmount: { type: String, default: "10000000000" },
    active: { type: Boolean, default: true }

},
    { timestamps: true }
);


export default TokenSchema;