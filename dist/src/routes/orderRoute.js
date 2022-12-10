"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const genController_1 = require("../controllers/genController");
const orderController_1 = require("../controllers/orderController");
const router = express_1.default.Router();
router.get("/tokens", genController_1.getAllTokens); //ok
router.get("/order/market/matched/:pairId", orderController_1.getMatchedMarketOrders); //ok
router.get("/order/limit/matched/:pairId", orderController_1.getLimitMatchedOrders); //ok
router.post("/order/create", orderController_1.handleOrderCreated); //ok
router.get("/", function (req, res) {
    res.send("hello world");
});
exports.default = router;
