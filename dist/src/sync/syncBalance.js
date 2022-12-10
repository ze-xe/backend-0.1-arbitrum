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
exports.startOrderStatus = exports.multicall = exports.getMultiBalance = void 0;
const ethers_1 = require("ethers");
const db_1 = require("../db");
const big_js_1 = __importDefault(require("big.js"));
const utils_1 = require("../utils");
const constant_1 = require("../helper/constant");
/**
 * @dev this function is use to get onchain data for create order api, i.e balance and allowance
 * @param {*} token (string) address of token
 * @param {*} maker (string) address of maker
 * @param {*} chainId (string) numeric chainId
 * @returns ([number])) [balance, allowance]
 */
function multicall(token, maker, chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const provider = (0, utils_1.getProvider)(chainId);
            const multicall = new ethers_1.ethers.Contract(constant_1.MulticallAddress[`${chainId}`], utils_1.MulticallAbi, provider);
            const itf = (0, utils_1.getInterface)((0, utils_1.getERC20ABI)());
            const input = [[token, itf.encodeFunctionData("balanceOf", [maker])], [token, itf.encodeFunctionData("allowance", [maker, (0, utils_1.getExchangeAddress)(chainId)])]];
            let resp = yield multicall.callStatic.aggregate(input);
            let outPut = [];
            for (let i in resp[1]) {
                outPut.push(Number(ethers_1.BigNumber.from(resp[1][i]).toString()));
            }
            return outPut;
        }
        catch (error) {
            console.log(`Error @ Multicall`, error);
            return null;
        }
    });
}
exports.multicall = multicall;
/**
 * @dev this function is used to check weather the fetched order is still active or not
 * @notice its check if maker has sufficeint token or not, and remove invalid data, update as inActive in DB
 * @param {*} token (string) address of token
 * @param {*} addresses ([string]) addresses of user
 * @param {*} ids ([string]) ids of orders
 * @param {*} data (object) document from DB
 * @param {*} chainId (string) numeric chainId
 * @param {*} amounts ([string]) numeric amounts of repective orders
 * @returns (object) only valid order send
 */
function getMultiBalance(token, addresses, ids, data, chainId, amounts) {
    return __awaiter(this, void 0, void 0, function* () {
        const _getMultiBalance = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const provider = (0, utils_1.getProvider)(chainId);
                const multicall = new ethers_1.ethers.Contract(constant_1.MulticallAddress[`${chainId}`], utils_1.MulticallAbi, provider);
                const itf = (0, utils_1.getInterface)((0, utils_1.getERC20ABI)());
                const resp = yield multicall.callStatic.aggregate(addresses.map((add) => {
                    return [
                        token,
                        itf.encodeFunctionData("balanceOf", [add]),
                    ];
                }));
                let inActiveIds = [];
                for (let i = 0; i < resp[1].length; i++) {
                    let balance = ethers_1.BigNumber.from(resp[1][i]).toString();
                    let userPosition = yield db_1.UserPosition.findOne({ token: token, id: addresses[i], chainId: chainId }).lean();
                    let inOrderBalance = (0, big_js_1.default)(userPosition.inOrderBalance);
                    if ((0, big_js_1.default)(balance) < inOrderBalance) {
                        inActiveIds.push(ids[i]);
                        let currentInOrderBalance = (0, big_js_1.default)(inOrderBalance).minus(amounts[i]).toString();
                        let updateUserPosition = db_1.UserPosition.findOneAndUpdate({ token: token, id: addresses[i], chainId: chainId }, { $set: { inOrderBalance: currentInOrderBalance } });
                        let deleteOrder = db_1.OrderCreated.findOneAndUpdate({ _id: ids[i] }, { $set: { active: false } });
                        yield Promise.all([updateUserPosition, deleteOrder]);
                    }
                }
                let res = [];
                for (let i in data) {
                    if (inActiveIds.includes(data[i]._id)) {
                        continue;
                    }
                    else {
                        res.push({
                            signature: data[i].signature,
                            value: {
                                maker: data[i].maker,
                                token0: data[i].token0,
                                token1: data[i].token1,
                                amount: data[i].amount,
                                buy: data[i].buy,
                                salt: data[i].salt,
                                exchangeRate: data[i].exchangeRate,
                            }
                        });
                    }
                }
                return res;
            }
            catch (error) {
                console.log("Error @ Multicall", error);
                return null;
            }
        });
        return _getMultiBalance();
    });
}
exports.getMultiBalance = getMultiBalance;
/**
 * @dev this function will run periodically e.g 30 min etc, it will check all the orders, for there maker balance and order amount, if order is active = false and now the user have sufficient balance then it will change its status to true, if order is active but now user does not have sufficient token then it will change its status to false
 * @param {*} chainId (string) numeric chainId
 */
function orderStatus(chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const provider = (0, utils_1.getProvider)(chainId);
            const multicall = new ethers_1.ethers.Contract(constant_1.MulticallAddress[`${chainId}`], utils_1.MulticallAbi, provider);
            const itf = (0, utils_1.getInterface)((0, utils_1.getERC20ABI)());
            let hasOrder = true;
            let page = 0;
            const _limit = 20;
            while (hasOrder == true) {
                const getOrderCreated = yield db_1.OrderCreated.find({ deleted: false, cancelled: false, chainId: chainId }).skip(page * _limit).limit(_limit).lean();
                if (getOrderCreated.length == 0) {
                    hasOrder = false;
                    break;
                }
                page++;
                let input = [];
                // creating input for multicall
                for (let k in getOrderCreated) {
                    if (getOrderCreated[k].buy == false) {
                        input.push([getOrderCreated[k].token0, itf.encodeFunctionData("balanceOf", [getOrderCreated[k].maker])]);
                    }
                    else if (getOrderCreated[k].buy == true) {
                        input.push([getOrderCreated[k].token1, itf.encodeFunctionData("balanceOf", [getOrderCreated[k].maker])]);
                    }
                }
                let resp = yield multicall.callStatic.aggregate(input);
                for (let i = 0; i < resp[1].length; i++) {
                    let balance = ethers_1.BigNumber.from(resp[1][i]).toString();
                    let token;
                    let amount;
                    let id = getOrderCreated[i].maker;
                    if (getOrderCreated[i].buy == false) {
                        token = getOrderCreated[i].token0;
                        amount = (0, big_js_1.default)(getOrderCreated[i].balanceAmount);
                    }
                    else {
                        token = getOrderCreated[i].token1;
                        amount = (0, big_js_1.default)(getOrderCreated[i].balanceAmount).times(getOrderCreated[i].exchangeRate).div((0, big_js_1.default)(10).pow(18));
                    }
                    if (getOrderCreated[i].active == true) {
                        const getUserPos = yield db_1.UserPosition.findOne({ token: token, id: id, chainId: chainId }).lean();
                        let inOrderBalance = (0, big_js_1.default)(getUserPos.inOrderBalance);
                        if (inOrderBalance > (0, big_js_1.default)(balance)) {
                            let currentInOrderBalance = (0, big_js_1.default)(inOrderBalance).minus(amount);
                            // updating inOrderBalance and active
                            yield Promise.all([db_1.OrderCreated.findOneAndUpdate({ _id: getOrderCreated[i]._id }, { $set: { active: false } }),
                                db_1.UserPosition.findOneAndUpdate({ _id: getUserPos._id }, { $set: { inOrderBalance: currentInOrderBalance } })]);
                            console.log("inactive", getOrderCreated[i].id, getUserPos.id);
                        }
                    }
                    else if (getOrderCreated[i].active == false) {
                        const getUserPos = yield db_1.UserPosition.findOne({ token: token, id: getOrderCreated[i].maker, chainId: getOrderCreated[i].chainId }).lean();
                        let inOrderBalance = (0, big_js_1.default)(getUserPos.inOrderBalance).plus(amount);
                        if (inOrderBalance < (0, big_js_1.default)(balance)) {
                            yield Promise.all([db_1.OrderCreated.findOneAndUpdate({ _id: getOrderCreated[i]._id }, { $set: { active: true } }),
                                db_1.UserPosition.findOneAndUpdate({ _id: getUserPos._id }, { $set: { inOrderBalance: inOrderBalance } })]);
                            console.log("active", getOrderCreated[i].id, getUserPos.id);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.log("Error @ orderStatus", error);
        }
    });
}
function startOrderStatus(chainId) {
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        console.log("order status start running");
        yield orderStatus(chainId);
        console.log("order status done updating");
    }), 1000 * 60 * 30);
}
exports.startOrderStatus = startOrderStatus;
// getMultiBalance("0x6CeEBBFF9FaA802990f58659c1Ff227B4534570C", ["0xCf1709Ad76A79d5a60210F23e81cE2460542A836", "0x6983D1E6DEf3690C4d616b13597A09e6193EA013"], "1666600000")
// .then((resp) => {
//     // console.log(BigNumber.from(resp[1][0]).toString())
//     console.log(resp)
// })
