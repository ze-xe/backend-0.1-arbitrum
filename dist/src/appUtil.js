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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const ethers_1 = require("ethers");
const big_js_1 = __importDefault(require("big.js"));
const db_1 = require("./db");
const axios_1 = __importDefault(require("axios"));
const exchange_1 = require("./sync/configs/exchange");
const sync_1 = require("./sync/sync");
const mongoose_1 = __importDefault(require("mongoose"));
const syncBalance_1 = require("./sync/syncBalance");
require("dotenv").config();
/**
 * @dev this function would check if there is any data in OrderCreated collection of main DB, if there is any data then it will  call historicEventListner and startOrderStatus. if there is no data in OrderCreated collection then it will search in backup collection and if there is any data then it will get signature and value and call order create api and call historicEventListner startOrderStatus functions.
 * @param {*} chainId (string) numeric chainId
 */
function start(chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let getCreateRecords = yield db_1.OrderCreated.find();
            if (getCreateRecords.length == 0) {
                yield mongoose_1.default.createConnection(process.env.MONGO_URL).dropDatabase();
                let page = 0;
                let _limit = 20;
                yield copy();
                function copy() {
                    return __awaiter(this, void 0, void 0, function* () {
                        console.log(page, "Page No");
                        let copyOrder = yield db_1.OrderCreatedBackup.find({ chainId: chainId }, { _id: 0, __v: 0 }).skip(page * _limit).limit(20).lean();
                        for (let i in copyOrder) {
                            let result = yield (0, axios_1.default)({
                                method: "post",
                                url: "http://localhost:3010/order/create",
                                data: {
                                    signature: copyOrder[i].signature,
                                    chainId: copyOrder[i].chainId.toString(),
                                    ipfs: true,
                                    data: {
                                        maker: copyOrder[i].maker,
                                        token0: copyOrder[i].token0,
                                        token1: copyOrder[i].token1,
                                        amount: ethers_1.ethers.utils.parseEther(`${(0, big_js_1.default)(copyOrder[i].amount).div((0, big_js_1.default)(10).pow(18))}`).toString(),
                                        buy: copyOrder[i].buy,
                                        salt: Number(copyOrder[i].salt),
                                        exchangeRate: ethers_1.ethers.utils.parseEther(`${(0, big_js_1.default)(copyOrder[i].exchangeRate).div((0, big_js_1.default)(10).pow(18))}`).toString(),
                                    }
                                }
                            });
                            console.log("backup Create Request", result.data);
                        }
                        page++;
                        if (copyOrder.length > 0) {
                            yield copy();
                        }
                    });
                }
            }
            (0, sync_1.historicEventListner)((0, exchange_1.ExchangeConfig)(chainId));
            (0, syncBalance_1.startOrderStatus)(chainId);
        }
        catch (error) {
            console.log("Error @ start", error);
        }
    });
}
exports.start = start;
