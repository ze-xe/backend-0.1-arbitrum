import mongoose from "mongoose";

export const MarginOrderCreatedSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    signature: { type: String, required: true, trim: true },
    pair: { type: String, required: true, trim: true },
    maker: { type: String, required: true, trim: true },
    token0: { type: String, required: true, trim: true },
    token1: { type: String, required: true, trim: true },
    salt: { type: String, required: true, trim: true },
    amount: { type: String, required: true, trim: true },
    exchangeRate: { type: String, required: true, trim: true },
    long: { type: Boolean, required: true, trim: true },
    exchangeRateDecimals: { type: String, required: true, trim: true },
    balanceAmount: { type: String, required: true, trim: true },
    deleted: { type: Boolean, required: true },
    active: { type: Boolean, required: true },
    chainId: String,
    cid: String,
    cancelled: { type: Boolean, default: false },
    borrowLimit: String,
    loops: String,


},
    { timestamps: true }
);