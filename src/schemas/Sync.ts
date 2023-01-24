import mongoose from "mongoose";

const exchangeSyncSchema = new mongoose.Schema({

    blockNumberExchange: Number,
    pageNumberExchange: Number,
    chainId: String,
    makerFee: { type: String, default: '0' },
    takerFee: { type: String, default: '0' }

},
    { timestamps: true }
);

export default exchangeSyncSchema;