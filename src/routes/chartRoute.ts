import express from "express";
import { getBar } from "../controllers/chart/getBar";
import { getSymbol } from "../controllers/chart/getSymbol";



const router = express.Router();




router.get("/bar/history/:ticker", getBar); 
router.get("/symbol", getSymbol)


export default router;