import express from "express";
import { handleBlackListToken } from "../controllers/pair/blackListPair";
import { getNewPair } from "../controllers/pair/newPair";
import { getPairTrandingPair } from "../controllers/pair/trandingPair";
import { getAllPairDetails, getPairOrderExecutedHistory, getPairTradingStatus, fetchOrders } from "../controllers/pairController";
const router = express.Router();




router.get("/allpairs", getAllPairDetails);//ok
router.get("/orders/history/:pairId", getPairOrderExecutedHistory);//ok
router.get("/trading/status/:pairId", getPairTradingStatus);//ok 
router.get("/orders/:pairId", fetchOrders); //ok
router.get("/newpairs", getNewPair);
router.get("/tranding", getPairTrandingPair)
router.put("/blacklist", handleBlackListToken)

export default router;