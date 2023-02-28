import mongoose from "mongoose";

const PairSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    token0: { type: String, required: true, trim: true },
    token1: { type: String, required: true, trim: true },
    spot:{ type: String, required: true, trim: true },
    priceDecimals: { type: String },
    minToken0Order: { type: String, required: true },
    price: { type: String, required: true },
    priceDiff: String,
    chainId: String,
    symbol: String,
    marginEnabled: { type: Boolean, default: true },
    active: { type: Boolean, default: true }

},
    { timestamps: true }
);


export default PairSchema;