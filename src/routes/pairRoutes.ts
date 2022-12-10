import express from "express";
import { getAllPairDetails, getPairPriceTrend, getPairOrderExecutedHistory, getPairTradingStatus, fetchOrders } from "../controllers/pairController";
const router = express.Router();




router.get("/allpairs", getAllPairDetails);//ok
router.get("/pricetrend/:pairId", getPairPriceTrend);//ok
router.get("/orders/history/:pairId", getPairOrderExecutedHistory);//ok
router.get("/trading/status/:pairId", getPairTradingStatus);//ok 
router.get("/orders/:pairId", fetchOrders); //ok

export default router;