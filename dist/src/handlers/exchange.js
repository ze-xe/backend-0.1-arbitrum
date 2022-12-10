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
exports.handleOrderCancelled = exports.handleOrderExecuted = void 0;
const db_1 = require("../db");
const big_js_1 = __importDefault(require("big.js"));
function handleOrderExecuted(data, argument) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isDuplicateTxn = yield db_1.OrderExecuted.findOne({
                txnId: argument.txnId,
                blockNumber: argument.blockNumber,
                blockTimestamp: argument.blockTimestamp,
            });
            if (isDuplicateTxn) {
                return;
            }
            let id = data[0];
            let taker = data[1];
            let fillAmount = data[2].toString();
            argument.id = id;
            argument.taker = taker;
            argument.fillAmount = fillAmount;
            let getOrderDetails = yield db_1.OrderCreated.findOne({ id: id }).lean();
            if (!getOrderDetails) {
                return console.log("OrderId not found @ execute", id);
            }
            let getPairDetails = yield db_1.PairCreated.findOne({ id: getOrderDetails.pair, chainId: getOrderDetails.chainId }).lean();
            argument.exchangeRate = getOrderDetails.exchangeRate;
            argument.pair = getOrderDetails.pair;
            // argument.exchangeRateDecimals = Number(getPairDetails.exchangeRateDecimals);
            argument.buy = getOrderDetails.buy;
            db_1.OrderExecuted.create(argument);
            let priceDiff = new big_js_1.default(getOrderDetails.exchangeRate).minus(getPairDetails.exchangeRate).toString();
            yield db_1.PairCreated.findOneAndUpdate({ _id: getPairDetails._id.toString() }, { $set: { exchangeRate: getOrderDetails.exchangeRate, priceDiff: priceDiff } });
            if (getOrderDetails.buy == false) {
                // for maker
                let token0 = getPairDetails.token0;
                let getUserPosition0 = yield db_1.UserPosition.findOne({ id: getOrderDetails.maker, token: token0 });
                if (!getUserPosition0) {
                    return console.log(`user position not found for token0 ${token0}, make ${getOrderDetails.maker}`);
                }
                let currentInOrderBalance0 = new big_js_1.default(getUserPosition0.inOrderBalance).minus(fillAmount).toString();
                yield db_1.UserPosition.findOneAndUpdate({ id: getOrderDetails.maker, token: token0 }, { $set: { inOrderBalance: currentInOrderBalance0 } });
                let currentFillAmount = new big_js_1.default(getOrderDetails.balanceAmount).minus(fillAmount).toString();
                if (Number(currentFillAmount) <= Number(getPairDetails.minToken0Order)) {
                    yield db_1.OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() }, { $set: { balanceAmount: currentFillAmount, deleted: true, active: false } });
                }
                else {
                    yield db_1.OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() }, { $set: { balanceAmount: currentFillAmount } });
                }
            }
            else if (getOrderDetails.buy == true) {
                // for maker
                let token1 = getPairDetails.token1;
                let getUserPosition1 = yield db_1.UserPosition.findOne({ id: getOrderDetails.maker, token: token1 });
                let currentBalance1 = (0, big_js_1.default)(getUserPosition1.inOrderBalance).minus((0, big_js_1.default)(fillAmount).times(getOrderDetails.exchangeRate).div((0, big_js_1.default)(10).pow(18)));
                yield db_1.UserPosition.findOneAndUpdate({ id: getOrderDetails.maker, token: token1 }, { $set: { inOrderBalance: currentBalance1 } });
                let currentFillAmount = new big_js_1.default(getOrderDetails.amount).minus(fillAmount).toString();
                if (Number(currentFillAmount) <= Number(getPairDetails.minToken0Order)) {
                    yield db_1.OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() }, { $set: { deleted: true, active: false, balanceAmount: currentFillAmount } });
                }
                else {
                    yield db_1.OrderCreated.findOneAndUpdate({ _id: getOrderDetails._id.toString() }, { $set: { balanceAmount: currentFillAmount } });
                }
            }
            console.log("Order Executed", taker, fillAmount, id);
        }
        catch (error) {
            console.log("Error @ handleOrderExecuted", error);
        }
    });
}
exports.handleOrderExecuted = handleOrderExecuted;
function handleOrderCancelled(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let id = data[0];
        let orderDetails = yield db_1.OrderCreated.findOne({ id: id });
        if (!orderDetails) {
            return console.log(`Order cancelled OrderId not found ${data[0]}`);
        }
        if (orderDetails.cancelled == true) {
            return console.log("Order is already cancelled");
        }
        // update user inOrder
        if (orderDetails.buy == false) {
            yield db_1.UserPosition.findOneAndUpdate({ id: orderDetails.maker, token: orderDetails.token0, chainId: orderDetails.chainId }, { $inc: { inOrderBalance: -orderDetails.balanceAmount } });
        }
        else if (orderDetails.buy == true) {
            let token1Amount = (0, big_js_1.default)(orderDetails.balanceAmount).times(orderDetails.exchangeRate).div((0, big_js_1.default)(10).pow(18)).toNumber();
            yield db_1.UserPosition.findOneAndUpdate({ id: orderDetails.maker, token: orderDetails.token1, chainId: orderDetails.chainId }, { $inc: { inOrderBalance: -token1Amount } });
        }
        yield db_1.OrderCreated.findOneAndUpdate({ _id: orderDetails._id }, { $set: { cancelled: true, active: false } });
        console.log(`order Cancelled, orderId : ${data[0]}`);
    });
}
exports.handleOrderCancelled = handleOrderCancelled;
