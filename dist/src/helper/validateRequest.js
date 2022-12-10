"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const createOrderSchemaData = joi_1.default.object().keys({
    maker: joi_1.default.string().required(),
    token0: joi_1.default.string().required(),
    token1: joi_1.default.string().required(),
    amount: joi_1.default.number().unsafe().required().max(10 ** 100),
    buy: joi_1.default.boolean().required(),
    salt: joi_1.default.number().required().max(100 ** 10),
    exchangeRate: joi_1.default.number().unsafe().required().max(10 ** 100)
});
const createOrderSchema = joi_1.default.object({
    createOrderSchemaData: createOrderSchemaData,
    signature: joi_1.default.string().required().max(250),
    chainId: joi_1.default.string().required().max(50)
});
exports.createOrderSchema = createOrderSchema;
