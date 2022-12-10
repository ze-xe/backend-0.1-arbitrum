"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
router.get("/orders/placed/:maker/pair/:pairId", userController_1.getUserPlacedOrders); //ok
router.get("/orders/history/:taker/pair/:pairId", userController_1.getUserOrderHistory); //ok
router.get("/orders/cancelled/:maker/pair/:pairId", userController_1.getOrderCancelled); //ok
router.get("/inorder/balance/:maker/token/:token", userController_1.getUserInOrderBalance); //ok
exports.default = router;
