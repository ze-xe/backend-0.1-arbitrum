import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    signature: { type: String, required: true, trim: true },
    pair: { type: String, required: true, trim: true },
    spot: { type: String, required: true, trim: true },
    maker: { type: String, required: true, trim: true },
    token0: { type: String, required: true, trim: true },
    token1: { type: String, required: true, trim: true },
    nonce: { type: String, required: true, trim: true },
    token0Amount: { type: String, required: true, trim: true },
    token1Amount: { type: String, default: "0" },
    leverage: { type: String, default: "0" },
    price: { type: String, required: true, trim: true },
    pairPrice: { type: String, required: true, trim: true },
    priceDecimals: { type: String, required: true, trim: true },
    balanceAmount: { type: String, required: true, trim: true },
    expiry: { type: String, required: true, trim: true },
    action: { type: Number, required: true },
    position: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    deleted: { type: Boolean,  default: false },
    active: { type: Boolean, default: true },
    expired: { type: Boolean, default: false },
    name:{type:String, required: true},
    version:{type:String, required: true},
    chainId: String,
    cid: String,
},
    { timestamps: true }
);


export default OrderSchema;