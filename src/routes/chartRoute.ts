import express from "express";
import { getBar, getSymbol } from "../controllers/chartController";


const router = express.Router();




router.get("/bar/history/:ticker", getBar); 
router.get("/symbol", getSymbol)


export default router;