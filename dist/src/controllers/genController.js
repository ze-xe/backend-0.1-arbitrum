"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTokens = void 0;
const db_1 = require("../db");
const errorMessage_1 = require("../helper/errorMessage");
function getAllTokens(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let chainId = req.query.chainId;
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            const getAllTokens = yield db_1.Token.find({ chainId: chainId }).select({ _id: 0, name: 1, symbol: 1, decimals: 1, id: 1 }).lean();
            return res.status(200).send({ status: true, data: getAllTokens });
        }
        catch (error) {
            console.log("Error @ getAllTokens", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getAllTokens = getAllTokens;
