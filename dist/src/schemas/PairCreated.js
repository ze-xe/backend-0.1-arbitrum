"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PairCreatedSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true, trim: true },
    token0: { type: String, required: true, trim: true },
    token1: { type: String, required: true, trim: true },
    // exchangeRateDecimals: { type: String, required: true },
    minToken0Order: { type: String, required: true },
    exchangeRate: { type: String, required: true },
    priceDiff: String,
    chainId: String
}, { timestamps: true });
exports.default = PairCreatedSchema;
