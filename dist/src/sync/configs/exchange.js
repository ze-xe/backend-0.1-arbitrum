"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeConfig = void 0;
const utils_1 = require("../../utils");
const utils_2 = require("../../utils");
const exchange_1 = require("../../handlers/exchange");
function ExchangeConfig(chainId) {
    return {
        contractAddress: (0, utils_1.getExchangeAddress)(chainId),
        abi: (0, utils_2.getExchangeABI)(),
        handlers: {
            "OrderExecuted": exchange_1.handleOrderExecuted,
            "OrderCancelled": exchange_1.handleOrderCancelled
        },
        chainId: chainId
    };
}
exports.ExchangeConfig = ExchangeConfig;
