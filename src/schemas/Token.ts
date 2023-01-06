import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({

    id: String,
    name: String,
    symbol: String,
    price: Number,
    decimals: Number,
    chainId: String,
    marginEnabled: {type:Boolean, default: false},
    cId: String,
    minTokenAmount: {type: String, default: "10000000000"},
    active: {type: Boolean, default: true}

},
    { timestamps: true }
);


export default TokenSchema;