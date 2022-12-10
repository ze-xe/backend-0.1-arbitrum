"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pairController_1 = require("../controllers/pairController");
const router = express_1.default.Router();
router.get("/allpairs", pairController_1.getAllPairDetails); //ok
router.get("/pricetrend/:pairId", pairController_1.getPairPriceTrend); //ok
router.get("/orders/history/:pairId", pairController_1.getPairOrderExecutedHistory); //ok
router.get("/trading/status/:pairId", pairController_1.getPairTradingStatus); //ok 
router.get("/orders/:pairId", pairController_1.fetchOrders); //ok
exports.default = router;
