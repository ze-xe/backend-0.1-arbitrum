"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const TokenSchema = new mongoose_1.default.Schema({
    id: String,
    name: String,
    symbol: String,
    price: Number,
    decimals: Number,
    chainId: String,
}, { timestamps: true });
exports.default = TokenSchema;
