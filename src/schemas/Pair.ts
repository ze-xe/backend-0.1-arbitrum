import mongoose from "mongoose";

const PairSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    token0: { type: String, required: true, trim: true },
    token1: { type: String, required: true, trim: true },
    exchangeRateDecimals: { type: String, required: true },
    minToken0Order: { type: String, required: true },
    exchangeRate: { type: String, required: true },
    priceDiff: String,
    chainId: String,
    symbol: String,
    marginEnabled: { type: Boolean, default: false },
    active: { type: Boolean, default: true }

},
    { timestamps: true }
);


export default PairSchema;