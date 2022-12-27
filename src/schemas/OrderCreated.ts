import mongoose from "mongoose";

const OrderCreatedSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    signature: { type: String, required: true, trim: true },
    pair: { type: String, required: true, trim: true },
    maker: { type: String, required: true, trim: true },
    token0: { type: String, required: true, trim: true },
    token1: { type: String, required: true, trim: true },
    salt: { type: String, required: true, trim: true },
    amount: { type: String, required: true, trim: true },
    exchangeRate: { type: String, required: true, trim: true },
    exchangeRateDecimals: { type: String, required: true, trim: true },
    balanceAmount: { type: String, required: true, trim: true },
    deleted: { type: Boolean, required: true },
    active: { type: Boolean, required: true },
    chainId: String,
    cid: String,
    cancelled: { type: Boolean, default: false },
    orderType: {type:Number, require: true},
    borrowLimit: {type:String, default: '0'},
    loops: {type:String, default: '0'},
    
},
    { timestamps: true }
);


export default OrderCreatedSchema;