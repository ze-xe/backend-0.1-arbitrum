import mongoose from "mongoose";

const PairSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    token0: { type: String, required: true, trim: true },
    token1: { type: String, required: true, trim: true },
    atoken0: { type: String, required: true, trim: true },
    atoken1: { type: String, required: true, trim: true },
    vtoken0: { type: String, required: true, trim: true },
    vtoken1: { type: String, required: true, trim: true },
    spot: { type: String, required: true, trim: true },
    priceDecimals: { type: String },
    minToken0Order: { type: String, required: true },
    price: { type: String, required: true },
    priceDiff: { type: String, default: "0" },
    chainId: { type: String, required: true },
    symbol: { type: String, required: true },
    marginEnabled: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    ltv0: { type: String, required: true },
    liqThreshold0: { type: String, required: true },
    liqBonus0: { type: String, required: true },
    decimals0: { type: String, required: true },
    ltv1: { type: String, required: true },
    liqThreshold1: { type: String, required: true },
    liqBonus1: { type: String, required: true },
    decimals1: { type: String, required: true },
    price0: { type: String, default: "0" },
    price1: { type: String, default: "0" }

},
    { timestamps: true }
);

// ltv0,
// liqThreshold0,
// liqBonus0,
// decimals0,
export default PairSchema;