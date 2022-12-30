import express from "express";
import { getAllPairDetails, getPairOrderExecutedHistory, getPairTradingStatus, fetchOrders, getMarginPairDetails } from "../controllers/pairController";
const router = express.Router();




router.get("/allpairs", getAllPairDetails);//ok
router.get("/margin/pairs", getMarginPairDetails);//ok
router.get("/orders/history/:pairId", getPairOrderExecutedHistory);//ok
router.get("/trading/status/:pairId", getPairTradingStatus);//ok 
router.get("/orders/:pairId", fetchOrders); //ok

export default router;