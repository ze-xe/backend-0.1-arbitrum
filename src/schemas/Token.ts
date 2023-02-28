import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({

    id: String,
    name: String,
    symbol: String,
    price: Number,
    decimals: Number,
    chainId: String,
    spot: String,
    marginEnabled: { type: Boolean, default: true },
    cId: String,
    minTokenAmount: { type: String, default: "10000000000" },
    active: { type: Boolean, default: true }

},
    { timestamps: true }
);


export default TokenSchema;