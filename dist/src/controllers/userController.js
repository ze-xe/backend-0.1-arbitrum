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
exports.getUserInOrderBalance = exports.getOrderCancelled = exports.getUserOrderHistory = exports.getUserPlacedOrders = void 0;
const db_1 = require("../db");
const errorMessage_1 = require("../helper/errorMessage");
const utils_1 = require("../utils");
function getUserPlacedOrders(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let maker = req.params.maker;
            let pairId = req.params.pairId;
            let chainId = req.query.chainId;
            if (!maker) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.maker });
            }
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            const getMakerOrders = yield db_1.OrderCreated.find({ maker: maker, pair: pairId, deleted: false, cancelled: false, active: true, chainId: chainId }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ buy: 1, exchangeRate: 1, amount: 1, _id: 0, id: 1 }).lean();
            return res.status(200).send({ status: true, data: getMakerOrders });
        }
        catch (error) {
            console.log("Error @ getUserPlacedOrders", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getUserPlacedOrders = getUserPlacedOrders;
function getUserOrderHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let taker = req.params.taker;
            let pairId = req.params.pairId;
            let chainId = req.query.chainId;
            if (!taker) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.taker });
            }
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            const getOrderHistory = yield db_1.OrderExecuted.find({ taker: taker, pair: pairId, chainId: chainId }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ buy: 1, exchangeRate: 1, fillAmount: 1, _id: 0 }).limit(50).lean();
            return res.status(200).send({ status: true, data: getOrderHistory });
        }
        catch (error) {
            console.log("Error @ getUserOrderHistory", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getUserOrderHistory = getUserOrderHistory;
function getOrderCancelled(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pairId = req.params.pairId;
            let maker = req.params.maker;
            let chainId = req.query.chainId;
            if (!maker) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.maker });
            }
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            let getOrderCancelledDoc = yield db_1.OrderCreated.find({ maker: maker, pair: pairId, chainId, cancelled: true }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ balanceAmount: 1, exchangeRate: 1, buy: 1, _id: 0 }).lean();
            return res.status(200).send({ status: true, data: getOrderCancelledDoc });
        }
        catch (error) {
            console.log("Error @ getMatchedMarketOrders", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getOrderCancelled = getOrderCancelled;
function getUserInOrderBalance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let token = req.params.token;
            let chainId = req.query.chainId;
            let maker = req.params.maker;
            if (!token) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.token });
            }
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            if (!maker) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.maker });
            }
            let userInOrder = yield db_1.UserPosition.find({ token: token, id: maker, chainId: chainId }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0, balance: 0 }).lean();
            if (userInOrder.length > 0) {
                userInOrder[0].inOrderBalance = (0, utils_1.parseEther)(userInOrder[0].inOrderBalance);
            }
            return res.status(200).send({ status: true, data: userInOrder });
        }
        catch (error) {
            console.log("Error @ getMatchedMarketOrders", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getUserInOrderBalance = getUserInOrderBalance;
