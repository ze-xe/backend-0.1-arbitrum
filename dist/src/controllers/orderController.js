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
exports.getMatchedMarketOrders = exports.getLimitMatchedOrders = exports.handleOrderCreated = void 0;
const db_1 = require("../db");
const token_1 = require("../handlers/token");
const utils_1 = require("../utils");
const big_js_1 = __importDefault(require("big.js"));
const ethers_1 = require("ethers");
const validateRequest_1 = require("../helper/validateRequest");
const syncBalance_1 = require("../sync/syncBalance");
const putFiles_1 = require("../IPFS/putFiles");
const errorMessage_1 = require("../helper/errorMessage");
/**
 *
 * @dev This api function would create order and store it into data base
 * @notice verify signature,check if data coming from backup, check user inOrder balance, wallet balance, allowance, if pair is not present then create corresponding token and pair
 * @param {*} req.body.signature (string)
 * @param {*} req.body.data (object) this data will be verify with the signature
 * example
 * "data" :{
    "maker": "0x103B62f68Da23f20055c572269be67fA7635f2fc",
    "token0": "0x842681C1fA28EF2AA2A4BDE174612e901D2b7827",
    "token1": "0xa50fABf59f2c11fF0F02E7c94A82B442611F37B2",
    "amount": "1000000000000000000",
    "buy": true,
    "salt": "12345",
    "exchangeRate": "18000000000000000000000"
    }
 * @param {*} req.body.chainId (string) numeric chainId
 * @param {*} req.body.ipfs (boolean) if it is present that means request is sent from backup
 * @returns  error with message if any validation fail, if success return order created successfully
 */
function handleOrderCreated(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let signature = req.body.signature;
            let data = req.body.data;
            let chainId = req.body.chainId;
            let ipfs = req.body.ipfs;
            let addresses = [data.maker, data.token0, data.token1];
            yield validateRequest_1.createOrderSchema.validateAsync({ createOrderSchemaData: req.body.data, signature: signature, chainId: chainId });
            for (let i in addresses) {
                if (!ethers_1.ethers.utils.isAddress(addresses[i])) {
                    console.log(`${errorMessage_1.errorMessage.address, addresses[i]}`);
                    return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.address });
                }
            }
            // let exchangeRateDecimals = Number(getDecimals(data.exchangeRate));
            // if (isNaN(exchangeRateDecimals) == true) {
            //     return res.status(400).send({ status: false, error: exchangeRateDecimals });
            // }
            let id = (0, utils_1.validateSignature)(data.maker, signature, data, chainId);
            if (!id) {
                console.log(errorMessage_1.errorMessage.signature);
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.signature });
            }
            const isOrderPresent = yield db_1.OrderCreated.findOne({ id: id, chainId: chainId }).lean();
            if (isOrderPresent) {
                return res.status(201).send({ status: true, message: "Order Already Created" });
            }
            let amount = (0, big_js_1.default)(data.amount);
            if (data.buy == false) {
                const findUserPosition = yield db_1.UserPosition.findOne({ id: data.maker, token: data.token0, chainId: chainId }).lean();
                let multicallData;
                let userToken0Balance = 0;
                let allowance = 0;
                if (!ipfs) {
                    multicallData = yield (0, syncBalance_1.multicall)(data.token0, data.maker, chainId);
                    if (multicallData) {
                        userToken0Balance = multicallData[0];
                        allowance = multicallData[1];
                    }
                }
                if (findUserPosition) {
                    let _id = findUserPosition._id.toString();
                    let currentInOrderBalance = (0, big_js_1.default)(findUserPosition.inOrderBalance).plus(amount).toString();
                    if (!ipfs && Number(allowance) < Number(currentInOrderBalance)) {
                        console.log(`${errorMessage_1.errorMessage.allowance} token0`);
                        return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.allowance });
                    }
                    if (!ipfs && Number(userToken0Balance) < Number(currentInOrderBalance)) {
                        console.log(`${errorMessage_1.errorMessage.balance} token0`);
                        return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.balance });
                    }
                    yield db_1.UserPosition.findOneAndUpdate({ _id: _id }, { $set: { inOrderBalance: currentInOrderBalance } });
                }
                else {
                    if (!ipfs && Number(allowance) < Number(amount)) {
                        console.log(`${errorMessage_1.errorMessage.allowance} token0`);
                        return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.allowance });
                    }
                    if (!ipfs && Number(userToken0Balance) < Number(amount)) {
                        console.log(`${errorMessage_1.errorMessage.balance} token0`);
                        return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.balance });
                    }
                    db_1.UserPosition.create({
                        token: data.token0,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        // balance: userToken0Balance,
                        id: data.maker
                    });
                }
            }
            else if (data.buy == true) {
                let findUserPosition = yield db_1.UserPosition.findOne({ id: data.maker, token: data.token1, chainId: chainId });
                let multicallData;
                let userToken1Balance = 0;
                let allowance = 0;
                if (!ipfs) {
                    multicallData = yield (0, syncBalance_1.multicall)(data.token1, data.maker, chainId);
                    if (multicallData) {
                        userToken1Balance = multicallData[0];
                        allowance = multicallData[1];
                    }
                }
                amount = (0, big_js_1.default)(amount).times(data.exchangeRate).div((0, big_js_1.default)(10).pow(18));
                if (findUserPosition) {
                    let _id = findUserPosition._id.toString();
                    let currentInOrderBalance = (0, big_js_1.default)(findUserPosition.inOrderBalance).plus(amount).toString();
                    if (!ipfs && Number(allowance) < Number(currentInOrderBalance)) {
                        console.log(`${errorMessage_1.errorMessage.allowance} token1`);
                        return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.allowance });
                    }
                    if (!ipfs && Number(userToken1Balance) < Number(currentInOrderBalance)) {
                        console.log(`${errorMessage_1.errorMessage.balance} token1`);
                        return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.balance });
                    }
                    yield db_1.UserPosition.findOneAndUpdate({ _id: _id }, { $set: { inOrderBalance: currentInOrderBalance } });
                }
                else {
                    if (!ipfs && Number(allowance) < Number(amount)) {
                        console.log(`${errorMessage_1.errorMessage.allowance} token1`);
                        return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.allowance });
                    }
                    if (!ipfs && Number(userToken1Balance) < Number(amount)) {
                        console.log(`${errorMessage_1.errorMessage.balance} token1`);
                        return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.balance });
                    }
                    db_1.UserPosition.create({
                        token: data.token1,
                        chainId: chainId,
                        inOrderBalance: amount.toString(),
                        // balance: userToken1Balance,
                        id: data.maker
                    });
                }
            }
            let isPairExist = yield db_1.PairCreated.findOne({ token0: data.token0, token1: data.token1, chainId: chainId }).lean();
            let createPair;
            if (!isPairExist) {
                let encoder = new ethers_1.ethers.utils.AbiCoder().encode(["address", "address"], [data.token0, data.token1]);
                let id = ethers_1.ethers.utils.keccak256(encoder);
                yield (0, token_1.handleToken)(data.token0, chainId);
                yield (0, token_1.handleToken)(data.token1, chainId);
                let temp = {
                    id: id,
                    // exchangeRateDecimals: exchangeRateDecimals,
                    minToken0Order: (10 ** 10).toString(),
                    exchangeRate: '0',
                    priceDiff: '0',
                    token0: data.token0,
                    token1: data.token1,
                    chainId: chainId
                };
                createPair = yield db_1.PairCreated.create(temp);
                console.log("Pair Created ", "T0 ", data.token0, "T1 ", data.token1, "CId ", chainId);
            }
            let pair;
            if (isPairExist) {
                pair = (_a = isPairExist.id) === null || _a === void 0 ? void 0 : _a.toString();
            }
            else {
                pair = createPair.id.toString();
            }
            let cid;
            if (!ipfs) {
                cid = yield (0, putFiles_1.mainIPFS)([
                    data,
                    signature,
                    chainId
                ], id);
                db_1.OrderCreatedBackup.create({
                    id: id,
                    signature: signature,
                    pair: pair,
                    token0: data.token0,
                    token1: data.token1,
                    maker: data.maker,
                    amount: data.amount,
                    salt: data.salt,
                    exchangeRate: data.exchangeRate,
                    buy: data.buy,
                    chainId: chainId,
                    // exchangeRateDecimals: exchangeRateDecimals,
                    balanceAmount: data.amount,
                    active: true,
                    deleted: false,
                    cid: cid
                });
            }
            db_1.OrderCreated.create({
                id: id,
                signature: signature,
                pair: pair,
                token0: data.token0,
                token1: data.token1,
                maker: data.maker,
                amount: data.amount,
                salt: data.salt,
                exchangeRate: data.exchangeRate,
                buy: data.buy,
                chainId: chainId,
                // exchangeRateDecimals: exchangeRateDecimals,
                balanceAmount: data.amount,
                active: true,
                deleted: false,
                cid: cid
            });
            console.log("Order Created ", "maker ", data.maker, "amount ", data.amount.toString(), id);
            return res.status(201).send({ status: true, message: "Order created successfully" });
        }
        catch (error) {
            if (error.isJoi == true)
                error.status = 422;
            console.log("Error @ handleOrderCreated", error);
            return res.status(error.status).send({ status: false, error: error.message });
        }
    });
}
exports.handleOrderCreated = handleOrderCreated;
/**
 * @dev this api function will provide order as per the exchangeRate
 * @param {*} req.params.pairId (string) a valid pairId required
 * @param {*} req.query.exchangeRate (string) a valid pairId required
 * @param {*} req.query.buy (boolean) true for buying false for selling
 * @param {*} req.query.chainId (string) numeric chainId
 * @param {*} req.query.amount (string) numeric amount to be buy or sell in 10 to the pow 18 form
 * @param {*} res
 * @returns
 */
function getLimitMatchedOrders(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pairId = req.params.pairId;
            let exchangeRate = req.query.exchangeRate;
            let buy = req.query.buy;
            let amount = Number(req.query.amount);
            let chainId = req.query.chainId;
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!exchangeRate || isNaN(Number(exchangeRate))) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.exchangerate });
            }
            if (!buy || (buy != "true" && buy != "false")) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.buy });
            }
            if (!amount || isNaN(amount) == true) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.amount });
            }
            const isPairIdExist = yield db_1.PairCreated.findOne({ id: pairId, chainId: chainId }).lean();
            if (!isPairIdExist) {
                return res.status(404).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            let getMatchedDoc = [];
            if (buy == "true") {
                getMatchedDoc = yield db_1.OrderCreated.aggregate([
                    {
                        $match: {
                            $and: [
                                { pair: pairId },
                                {
                                    exchangeRate: {
                                        $lte: exchangeRate
                                    }
                                },
                                { buy: false },
                                { chainId: chainId },
                                { deleted: false },
                                { active: true },
                                { cancelled: false }
                            ]
                        }
                    },
                    {
                        $sort: { exchangeRate: 1, balanceAmount: 1 }
                    }
                ]);
            }
            else if (buy == "false") {
                getMatchedDoc = yield db_1.OrderCreated.aggregate([
                    {
                        $match: {
                            $and: [
                                { pair: pairId },
                                {
                                    exchangeRate: {
                                        $gte: exchangeRate
                                    }
                                },
                                { buy: true },
                                { chainId: chainId },
                                { deleted: false },
                                { active: true },
                                { cancelled: false }
                            ]
                        }
                    },
                    {
                        $sort: { exchangeRate: -1, balanceAmount: 1 }
                    }
                ]);
            }
            let data = [];
            let currAmount = 0;
            let counter = 0;
            let addresses = [];
            let amounts = [];
            let ids = [];
            if (getMatchedDoc.length == 0) {
                return res.status(200).send({ status: true, data: [] });
            }
            for (let i = 0; i < getMatchedDoc.length; i++) {
                if (currAmount >= amount) {
                    counter++;
                    if (counter > 10) {
                        break;
                    }
                }
                currAmount += Number(getMatchedDoc[i].balanceAmount);
                addresses.push(getMatchedDoc[i].maker);
                amounts.push(Number(getMatchedDoc[i].balanceAmount));
                data.push(getMatchedDoc[i]);
                ids.push(getMatchedDoc[i]._id);
            }
            let token;
            if (buy == "true") {
                token = data[0].token0;
            }
            else {
                token = data[0].token1;
            }
            const response = yield (0, syncBalance_1.getMultiBalance)(token, addresses, ids, data, chainId, amounts);
            if (!response) {
                return res.status(200).send({ status: true, data: [] });
            }
            return res.status(200).send({ status: true, data: response });
        }
        catch (error) {
            console.log("Error @ getMatchedOrders", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getLimitMatchedOrders = getLimitMatchedOrders;
function getMatchedMarketOrders(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pairId = req.params.pairId;
            let buy = req.query.buy;
            let amount = Number(req.query.amount);
            let chainId = req.query.chainId;
            if (!chainId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.chainId });
            }
            if (!pairId) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.pairId });
            }
            if (!buy || (buy != "false" && buy != "true")) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.buy });
            }
            if (isNaN(amount) == true || amount <= 0) {
                return res.status(400).send({ status: false, error: errorMessage_1.errorMessage.amount });
            }
            let getMatchedDoc = [];
            if (buy == "true") {
                getMatchedDoc = yield db_1.OrderCreated.find({ pair: pairId, buy: false, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1 }).lean();
            }
            else if (buy == "false") {
                getMatchedDoc = yield db_1.OrderCreated.find({ pair: pairId, buy: true, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1 }).lean();
            }
            let data = [];
            let currAmount = 0;
            let counter = 0;
            let addresses = [];
            let amounts = [];
            let ids = [];
            for (let i = 0; i < (getMatchedDoc === null || getMatchedDoc === void 0 ? void 0 : getMatchedDoc.length); i++) {
                if (currAmount >= amount) {
                    counter++;
                    if (counter > 5) {
                        break;
                    }
                }
                if (buy == "true") {
                    currAmount += Number((0, big_js_1.default)(getMatchedDoc[i].balanceAmount).times(getMatchedDoc[i].exchangeRate).div((0, big_js_1.default)(10).pow(18)));
                }
                else if (buy == "false") {
                    currAmount += Number(getMatchedDoc[i].balanceAmount);
                }
                addresses.push(getMatchedDoc[i].maker);
                amounts.push(Number(getMatchedDoc[i].balanceAmount));
                data.push(getMatchedDoc[i]);
                ids.push(getMatchedDoc[i]._id);
            }
            if (getMatchedDoc.length == 0) {
                return res.status(200).send({ status: true, data: [] });
            }
            let token;
            if (buy == "true") {
                token = data[0].token0;
            }
            else {
                token = data[0].token1;
            }
            let result = yield (0, syncBalance_1.getMultiBalance)(token, addresses, ids, data, chainId, amounts);
            if (!result) {
                return res.status(200).send({ status: true, data: [] });
            }
            return res.status(200).send({ status: true, data: data });
        }
        catch (error) {
            console.log("Error @ getMatchedMarketOrders", error);
            return res.status(500).send({ status: false, error: error.message });
        }
    });
}
exports.getMatchedMarketOrders = getMatchedMarketOrders;
// if (buy == 'true') {
//     getMatchedDoc = await OrderCreated.find({ pair: pairId, exchangeRate: { $lte: Number(exchangeRate) }, buy: false, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: 1, balanceAmount: 1 }).lean();
// }
// else if (buy == 'false') {
//     getMatchedDoc = await OrderCreated.find({ pair: pairId, exchangeRate: { $gte: Number(exchangeRate) }, buy: true, chainId: chainId, deleted: false, active: true, cancelled: false }).sort({ exchangeRate: -1, balanceAmount: 1 }).lean();
// }
