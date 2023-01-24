import express from "express";
import { getUserInOrderBalance } from "../controllers/user/inOrderBalance";
import { getOrderCancelled } from "../controllers/user/orderCancelled";
import { getUserOrderHistory } from "../controllers/user/orderHistory";
import { getUserPlacedOrders } from "../controllers/user/placedOrders";
const router = express.Router();


router.get("/orders/placed/:maker/pair/:pairId", getUserPlacedOrders);//ok
router.get("/orders/history/:taker/pair/:pairId", getUserOrderHistory);//ok
router.get("/orders/cancelled/:maker/pair/:pairId", getOrderCancelled);//ok
router.get("/inorder/balance/:maker/token/:token", getUserInOrderBalance);//ok




export default router;