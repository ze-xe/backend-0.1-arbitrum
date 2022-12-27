import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({

    id: String,
    name: String,
    symbol: String,
    price: Number,
    decimals: Number,
    chainId: String,
    marginEnabled: {type:Boolean, default: false}

},
    { timestamps: true }
);


export default TokenSchema;