import mongoose from "mongoose";

const OrderExecutedSchema = new mongoose.Schema({
    txnId: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    blockTimestamp: { type: Number, required: true },
    id: { type: String, required: true, trim: true },
    taker: { type: String, required: true, trim: true },
    fillAmount: { type: String, required: true, trim: true },
    pairToken0Amount: { type: String, required: true, trim: true },
    pair: { type: String, required: true, trim: true },
    pairPrice: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    priceDecimals: { type: Number, required: true, trim: true },
    action: { type: String, required: true },
    position:{type: String,required: true},
    leverage: { type: String,required: true},
    chainId: String,
    logIndex: Number

},
    { timestamps: true }
);


export default OrderExecutedSchema;