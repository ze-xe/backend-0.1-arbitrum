import mongoose from "mongoose";

const exchangeSyncSchema = new mongoose.Schema({

    blockNumberExchange: Number,
    pageNumberExchange: Number,
    chainId: String

},
    { timestamps: true }
);

export default exchangeSyncSchema;