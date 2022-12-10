import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({

    id: String,
    name: String,
    symbol: String,
    price: Number,
    decimals: Number,
    chainId: String,


},
    { timestamps: true }
);


export default TokenSchema;