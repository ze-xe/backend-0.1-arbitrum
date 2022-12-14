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
exports.fetchOrders = exports.getPairTradingStatus = exports.getPairOrderExecutedHistory = exports.getPairPriceTrend = exports.getAllPairDetails = void 0;
const db_1 = require("../db");
const big_js_1 = __importDefault(require("big.js"));
const utils_1 = require("../utils");
const constant_1 = require("../helper/constant");
const errorMessage_1 = require("../helper/errorMessage");
function fetchOrders(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pairId = req.params.pairId;
            let chainId = req.query.chainId;
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            const isPairIdExist = yield db_1.PairCreated.findOne({ id: pairId }).lean();
            if (!isPairIdExist) {
                return res.status(404).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            let buyOrder = db_1.OrderCreated.find({ pair: pairId, chainId: chainId, buy: true, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1 });
            let sellOrder = db_1.OrderCreated.find({ pair: pairId, chainId: chainId, buy: false, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1 }).lean();
            let promise = yield Promise.all([buyOrder, sellOrder]);
            buyOrder = promise[0];
            sellOrder = promise[1];
            let mapBuy = {};
            let mapSell = {};
            for (let i = 0; i < buyOrder.length; i++) {
                if (!mapBuy[`${buyOrder[i].exchangeRate}`]) {
                    mapBuy[`${buyOrder[i].exchangeRate}`] = buyOrder[i].balanceAmount;
                }
                else if (mapBuy[`${buyOrder[i].exchangeRate}`]) {
                    mapBuy[`${buyOrder[i].exchangeRate}`] = Number(mapBuy[`${buyOrder[i].exchangeRate}`]) + Number(buyOrder[i].balanceAmount);
                }
            }
            for (let i in sellOrder) {
                if (!mapSell[`${sellOrder[i].exchangeRate}`]) {
                    mapSell[`${sellOrder[i].exchangeRate}`] = sellOrder[i].balanceAmount;
                }
                else if (mapSell[`${sellOrder[i].exchangeRate}`]) {
                    mapSell[`${sellOrder[i].exchangeRate}`] = Number(mapSell[`${sellOrder[i].exchangeRate}`]) + Number(sellOrder[i].balanceAmount);
                }
            }
            let buyOrders = [];
            let buyEntries = Object.entries(mapBuy);
            for (let i in buyEntries) {
                let temp = {
                    exchangeRate: buyEntries[i][0],
                    amount: (buyEntries[i][1]).toString()
                };
                buyOrders.push(temp);
            }
            let sellOrders = [];
            let sellEntries = Object.entries(mapSell);
            for (let i in sellEntries) {
                let temp = {
                    exchangeRate: sellEntries[i][0],
                    amount: sellEntries[i][1],
                };
                sellOrders.push(temp);
            }
            let data = {
                pair: pairId,
                decimals: constant_1.Decimals.token,
                sellOrders: sellOrders,
                buyOrders: buyOrders
            };
            return res.status(200).send({ status: true, data: data });
        }
        catch (error) {
            console.log("Error @ fetchOrders", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.fetchOrders = fetchOrders;
function getAllPairDetails(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let chainId = req.query.chainId;
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            let allPairs = yield db_1.PairCreated.find({ chainId: chainId }).lean();
            let data = [];
            let promiseTokens = [];
            for (let i in allPairs) {
                let token0 = db_1.Token.findOne({ id: allPairs[i].token0 }).select({ name: 1, symbol: 1, decimals: 1, _id: 0, id: 1 }).lean();
                let token1 = db_1.Token.findOne({ id: allPairs[i].token1 }).select({ name: 1, symbol: 1, decimals: 1, _id: 0, id: 1 }).lean();
                promiseTokens.push(token0, token1);
            }
            promiseTokens = yield Promise.all(promiseTokens);
            for (let i = 0; i < allPairs.length; i++) {
                let token0 = promiseTokens[2 * i];
                let token1 = promiseTokens[2 * i + 1];
                let temp = {
                    id: allPairs[i].id,
                    exchangeRate: allPairs[i].exchangeRate,
                    // exchangeRateDecimals: allPairs[i].exchangeRateDecimals,
                    priceDiff: (0, utils_1.parseEther)(allPairs[i].priceDiff),
                    minToken0Order: allPairs[i].minToken0Order,
                    tokens: [token0, token1]
                };
                data.push(temp);
            }
            res.status(200).send({ status: true, data: data });
        }
        catch (error) {
            console.log("Error @ getAllPairDetails", error);
            res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getAllPairDetails = getAllPairDetails;
function _getPairPriceTrend(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pairId = req.params.pairId;
            let interval = Number(req.query.interval);
            let chainId = req.query.chainId;
            if (isNaN(interval) == true || interval < 300000) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.interval });
            }
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            let data = yield db_1.OrderExecuted.find({ pair: pairId, chainId: chainId }).sort({ blockTimestamp: 1, createdAt: 1 }).lean();
            console.log(data.length);
            if (data.length == 0) {
                let isPairExist = yield db_1.PairCreated.findOne({ id: pairId, chainId }).lean();
                if (!isPairExist) {
                    return res.status(404).send({ status: false, error: errorMessage_1.errorMessage.pairId });
                }
                return res.status(200).send({ status: true, data: [] });
            }
            let exchangeRatesTrend = [];
            let volumeTrend = [];
            let min = (0, big_js_1.default)(Number.MAX_VALUE).toString();
            let max = (0, big_js_1.default)(0).toString();
            let open = data[0].exchangeRate;
            let close = data[0].exchangeRate;
            let currTimestamp = data[0].blockTimestamp;
            let closeTimeStamp = data[0].blockTimestamp;
            let volume = 0;
            for (let i = 0; i < data.length; i++) {
                if (data[i].blockTimestamp > currTimestamp + interval) {
                }
                if (data[i].blockTimestamp <= currTimestamp + interval) {
                    // this block will mainly update the min max, open close value
                    if (Number(data[i].exchangeRate) > Number(max)) {
                        max = data[i].exchangeRate;
                    }
                    if (Number(data[i].exchangeRate) < Number(min)) {
                        min = data[i].exchangeRate;
                    }
                    close = data[i].exchangeRate;
                    volume = (0, big_js_1.default)(volume).plus(data[i].fillAmount).toString();
                    if (i == data.length - 1) {
                        let temp = {
                            time: currTimestamp / 1000,
                            open: (0, big_js_1.default)(open).div((0, big_js_1.default)(10).pow(18)).toString(),
                            high: (0, big_js_1.default)(max).div((0, big_js_1.default)(10).pow(18)).toString(),
                            close: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                            low: (0, big_js_1.default)(min).div((0, big_js_1.default)(10).pow(18)).toString(),
                        };
                        exchangeRatesTrend.push(temp);
                        volumeTrend.push({ time: currTimestamp / 1000, value: (0, big_js_1.default)(volume).div((0, big_js_1.default)(10).pow(18)).toString() });
                    }
                }
                else {
                    //if value exceed it will  genrate object regarding upper if block
                    let temp = {
                        time: currTimestamp / 1000,
                        open: (0, big_js_1.default)(open).div((0, big_js_1.default)(10).pow(18)).toString(),
                        high: (0, big_js_1.default)(max).div((0, big_js_1.default)(10).pow(18)).toString(),
                        close: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                        low: (0, big_js_1.default)(min).div((0, big_js_1.default)(10).pow(18)).toString(),
                    };
                    exchangeRatesTrend.push(temp);
                    volumeTrend.push({ time: currTimestamp / 1000, value: (0, big_js_1.default)(volume).div((0, big_js_1.default)(10).pow(18)).toString() });
                    // here now we are updating value as per the current itration
                    min = data[i].exchangeRate;
                    max = data[i].exchangeRate;
                    open = data[i].exchangeRate;
                    close = data[i].exchangeRate;
                    currTimestamp = data[i].blockTimestamp;
                    volume = data[i].fillAmount;
                    if (i == data.length - 1) {
                        let temp = {
                            time: currTimestamp / 1000,
                            open: (0, big_js_1.default)(open).div((0, big_js_1.default)(10).pow(18)).toString(),
                            high: (0, big_js_1.default)(max).div((0, big_js_1.default)(10).pow(18)).toString(),
                            close: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                            low: (0, big_js_1.default)(min).div((0, big_js_1.default)(10).pow(18)).toString(),
                        };
                        exchangeRatesTrend.push(temp);
                        volumeTrend.push({ time: currTimestamp / 1000, value: (0, big_js_1.default)(volume).div((0, big_js_1.default)(10).pow(18)).toString() });
                    }
                }
            }
            let result = {
                exchangeRate: exchangeRatesTrend,
                volume: volumeTrend
            };
            return res.status(200).send({ status: true, data: result });
        }
        catch (error) {
            console.log("Error @ getPriceDetails", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
function getPairPriceTrend(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pairId = req.params.pairId;
            let interval = Number(req.query.interval);
            let chainId = req.query.chainId;
            if (isNaN(interval) == true || interval < 300000) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.interval });
            }
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            let data = yield db_1.OrderExecuted.find({ pair: pairId, chainId: chainId }).sort({ blockTimestamp: 1, createdAt: 1 }).lean();
            console.log(data.length);
            if (data.length == 0) {
                let isPairExist = yield db_1.PairCreated.findOne({ id: pairId, chainId }).lean();
                if (!isPairExist) {
                    return res.status(404).send({ status: false, error: errorMessage_1.errorMessage.pairId });
                }
                return res.status(200).send({ status: true, data: [] });
            }
            let exchangeRatesTrend = [];
            let volumeTrend = [];
            let min = (0, big_js_1.default)(Number.MAX_VALUE).toString();
            let max = (0, big_js_1.default)(0).toString();
            let open = data[0].exchangeRate;
            let close = data[0].exchangeRate;
            let currTimestamp = data[0].blockTimestamp;
            let closeTimeStamp = data[0].blockTimestamp;
            let volume = 0;
            for (let i = 0; i < data.length; i++) {
                if (data[i].blockTimestamp <= currTimestamp + interval) {
                    // this block will mainly update the min max, open close value
                    if (Number(data[i].exchangeRate) > Number(max)) {
                        max = data[i].exchangeRate;
                    }
                    if (Number(data[i].exchangeRate) < Number(min)) {
                        min = data[i].exchangeRate;
                    }
                    close = data[i].exchangeRate;
                    volume = (0, big_js_1.default)(volume).plus(data[i].fillAmount).toString();
                    if (i == data.length - 1) {
                        let temp = {
                            time: currTimestamp / 1000,
                            open: (0, big_js_1.default)(open).div((0, big_js_1.default)(10).pow(18)).toString(),
                            high: (0, big_js_1.default)(max).div((0, big_js_1.default)(10).pow(18)).toString(),
                            close: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                            low: (0, big_js_1.default)(min).div((0, big_js_1.default)(10).pow(18)).toString(),
                        };
                        exchangeRatesTrend.push(temp);
                        volumeTrend.push({ time: currTimestamp / 1000, value: (0, big_js_1.default)(volume).div((0, big_js_1.default)(10).pow(18)).toString() });
                    }
                }
                else {
                    //if value exceed it will  genrate object regarding upper if block
                    let temp = {
                        time: currTimestamp / 1000,
                        open: (0, big_js_1.default)(open).div((0, big_js_1.default)(10).pow(18)).toString(),
                        high: (0, big_js_1.default)(max).div((0, big_js_1.default)(10).pow(18)).toString(),
                        close: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                        low: (0, big_js_1.default)(min).div((0, big_js_1.default)(10).pow(18)).toString(),
                    };
                    exchangeRatesTrend.push(temp);
                    volumeTrend.push({ time: currTimestamp / 1000, value: (0, big_js_1.default)(volume).div((0, big_js_1.default)(10).pow(18)).toString() });
                    currTimestamp = currTimestamp + interval;
                    // checking next block lays in next interval
                    if (data[i].blockTimestamp > currTimestamp + interval) {
                        let temp = {
                            time: (currTimestamp) / 1000,
                            open: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                            high: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                            close: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                            low: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                        };
                        exchangeRatesTrend.push(temp);
                        volumeTrend.push({ time: (currTimestamp) / 1000, value: '0' });
                        min = close;
                        max = close;
                        open = close;
                        close = close;
                        currTimestamp = currTimestamp + interval;
                        volume = '0';
                        i--;
                    }
                    else {
                        // block fall in that interval
                        min = data[i].exchangeRate;
                        max = data[i].exchangeRate;
                        open = close;
                        close = data[i].exchangeRate;
                        // currTimestamp = currTimestamp + interval;
                        volume = data[i].fillAmount;
                    }
                    if (i == data.length - 1) {
                        let temp = {
                            time: currTimestamp / 1000,
                            open: (0, big_js_1.default)(open).div((0, big_js_1.default)(10).pow(18)).toString(),
                            high: (0, big_js_1.default)(max).div((0, big_js_1.default)(10).pow(18)).toString(),
                            close: (0, big_js_1.default)(close).div((0, big_js_1.default)(10).pow(18)).toString(),
                            low: (0, big_js_1.default)(min).div((0, big_js_1.default)(10).pow(18)).toString(),
                        };
                        exchangeRatesTrend.push(temp);
                        volumeTrend.push({ time: currTimestamp / 1000, value: (0, big_js_1.default)(volume).div((0, big_js_1.default)(10).pow(18)).toString() });
                    }
                }
            }
            let result = {
                exchangeRate: exchangeRatesTrend,
                volume: volumeTrend
            };
            return res.status(200).send({ status: true, data: result });
        }
        catch (error) {
            console.log("Error @ getPriceDetails", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getPairPriceTrend = getPairPriceTrend;
function getPairOrderExecutedHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pairId = req.params.pairId;
            let chainId = req.query.chainId;
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            let getPairOrderHistory = yield db_1.OrderExecuted.find({ pair: pairId, chainId }).sort({ blockTimestamp: -1, createdAt: -1 }).select({ fillAmount: 1, exchangeRate: 1, buy: 1, _id: 0 }).limit(50).lean();
            return res.status(200).send({ status: true, data: getPairOrderHistory });
        }
        catch (error) {
            console.log("Error @ getPairOrderExecutedHistory", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getPairOrderExecutedHistory = getPairOrderExecutedHistory;
function getPairTradingStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pairId = req.params.pairId;
            let _24hr = 24 * 60 * 60 * 1000;
            let _7D = 7 * _24hr;
            let _30D = 30 * _24hr;
            let _90D = 3 * _30D;
            let _1Yr = 365 * _24hr;
            let interval = [_24hr, _7D, _30D, _90D, _1Yr];
            let data = [];
            for (let i in interval) {
                let getOrderExecuted = yield db_1.OrderExecuted.aggregate([
                    {
                        $match: {
                            $and: [
                                { pair: pairId },
                                { blockTimestamp: { $gte: Date.now() - interval[i] } }
                            ]
                        }
                    },
                    {
                        $sort: { blockTimestamp: -1, createdAt: -1 }
                    },
                    {
                        $addFields: {
                            amount: { $toDecimal: "$fillAmount" },
                        }
                    },
                    {
                        $facet: {
                            "exchangeRate": [
                                {
                                    $group: {
                                        _id: null,
                                        first: { $first: "$exchangeRate" },
                                        last: { $last: "$exchangeRate" }
                                    }
                                },
                                { $project: { first: 1, last: 1, _id: 0 } }
                            ],
                            "volume": [
                                {
                                    $group: {
                                        _id: null,
                                        volume: { $sum: "$amount" },
                                        count: { $sum: 1 }
                                    }
                                }
                            ]
                        }
                    }
                ]);
                let intervalStr = ["_24hr", " _7D", " _30D", "_90D", " _1Yr"];
                if (getOrderExecuted[0].exchangeRate.length <= 0) {
                    let temp = {
                        interval: `${intervalStr[i]}`,
                        changeInER: 0,
                        volume: 0
                    };
                    data.push(temp);
                }
                else {
                    let changeInER = getOrderExecuted[0].exchangeRate[0].first - getOrderExecuted[0].exchangeRate[0].last;
                    changeInER = (changeInER / getOrderExecuted[0].exchangeRate[0].last) * 100;
                    let volume = Number(getOrderExecuted[0].volume[0].volume) / 10 ** 18;
                    let temp = {
                        interval: `${intervalStr[i]}`,
                        changeInER: changeInER,
                        volume: volume
                    };
                    data.push(temp);
                }
            }
            return res.status(200).send({ status: true, data: data });
        }
        catch (error) {
            console.log("Error @ getPairTradingStatus", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getPairTradingStatus = getPairTradingStatus;
