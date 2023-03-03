import express from "express";
import { getUserPoolBalance } from "../controllers/pool/userBalance";
import { getUserInOrderBalance } from "../controllers/user/inOrderBalance";
import { getOrderCancelled } from "../controllers/user/orderCancelled";
import { getUserOrderHistory } from "../controllers/user/orderHistory";
import { getUserPlacedOrders } from "../controllers/user/placedOrders";
import { getUserPosition } from "../controllers/user/userPosition";
const router = express.Router();


router.get("/orders/placed/:maker/pair/:pairId", getUserPlacedOrders);//ok
router.get("/orders/history/:taker/pair/:pairId", getUserOrderHistory);//ok
router.get("/orders/cancelled/:maker/pair/:pairId", getOrderCancelled);//ok
router.get("/inorder/balance/:maker/token/:token", getUserInOrderBalance);//ok
router.get("/position/:maker", getUserPosition)
router.get("/pool/balance/:maker", getUserPoolBalance)



export default router;