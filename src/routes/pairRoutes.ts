import express from "express";
import { getAllPairDetails } from "../controllers/pair/allPairDetails";
import { handleBlackListToken } from "../controllers/pair/blackListPair";
import { fetchOrders } from "../controllers/pair/fetchOrders";
import { getNewPair } from "../controllers/pair/newPair";
import { getPairOrderExecutedHistory } from "../controllers/pair/pairOrderExecutedHistory";
import { getPairTradingStatus } from "../controllers/pair/pairTradingStatus";
import { getPairTrandingPair } from "../controllers/pair/trandingPair";
const router = express.Router();




router.get("/allpairs", getAllPairDetails);//ok
router.get("/orders/history/:pairId", getPairOrderExecutedHistory);//ok
router.get("/trading/status/:pairId", getPairTradingStatus);//ok 
router.get("/orders/:pairId", fetchOrders); //ok
router.get("/newpairs", getNewPair);
router.get("/tranding", getPairTrandingPair)
router.put("/blacklist", handleBlackListToken)

export default router;