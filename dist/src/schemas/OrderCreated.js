"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const OrderCreatedSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true, trim: true },
    signature: { type: String, required: true, trim: true },
    pair: { type: String, required: true, trim: true },
    maker: { type: String, required: true, trim: true },
    token0: { type: String, required: true, trim: true },
    token1: { type: String, required: true, trim: true },
    salt: { type: String, required: true, trim: true },
    amount: { type: String, required: true, trim: true },
    exchangeRate: { type: String, required: true, trim: true },
    buy: { type: Boolean, required: true, trim: true },
    // exchangeRateDecimals: { type: String, required: true, trim: true },
    balanceAmount: { type: String, required: true, trim: true },
    deleted: { type: Boolean, required: true },
    active: { type: Boolean, required: true },
    chainId: String,
    cid: String,
    cancelled: { type: Boolean, default: false }
}, { timestamps: true });
exports.default = OrderCreatedSchema;
