"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const OrderExecutedSchema = new mongoose_1.default.Schema({
    txnId: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    blockTimestamp: { type: Number, required: true },
    id: { type: String, required: true, trim: true },
    taker: { type: String, required: true, trim: true },
    fillAmount: { type: String, required: true, trim: true },
    pair: { type: String, required: true, trim: true },
    exchangeRate: { type: String, required: true, trim: true },
    // exchangeRateDecimals: { type: Number, required: true, trim: true },
    buy: { type: Boolean, required: true },
    chainId: String,
}, { timestamps: true });
exports.default = OrderExecutedSchema;
