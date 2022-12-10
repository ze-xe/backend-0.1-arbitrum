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
exports.handleToken = void 0;
const db_1 = require("../db");
const utils_1 = require("../utils");
const ethers_1 = require("ethers");
function handleToken(token, chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isTokenExist = yield db_1.Token.findOne({ id: token });
            if (isTokenExist) {
                return;
            }
            let provider = (0, utils_1.getProvider)(chainId);
            let getTokenDetails = new ethers_1.ethers.Contract(token, (0, utils_1.getERC20ABI)(), provider);
            let name = getTokenDetails["name"]();
            let symbol = getTokenDetails["symbol"]();
            let decimals = getTokenDetails["decimals"]();
            let promise = yield Promise.all([name, symbol, decimals]);
            name = promise[0];
            symbol = promise[1];
            decimals = promise[2];
            let temp = {
                id: token,
                name: name,
                symbol: symbol,
                decimals: decimals,
                price: "0",
                chainId: chainId
            };
            db_1.Token.create(temp);
            console.log("Token Added", token, chainId);
        }
        catch (error) {
            console.log("Error @ handleToken1", error);
        }
    });
}
exports.handleToken = handleToken;
