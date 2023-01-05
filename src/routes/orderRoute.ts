import express from "express";
import { getAllTokens, getFeeSet } from "../controllers/genController";
import { handleOrderCreated, getLimitMatchedOrders, getMatchedMarketOrders } from "../controllers/orderController";
import { version } from "../helper/constant";

const router = express.Router();




router.get(`/v/${version}/tokens`, getAllTokens); //ok
router.get(`/v/${version}/order/market/matched/:pairId`, getMatchedMarketOrders);//ok
router.get(`/v/${version}/order/limit/matched/:pairId`, getLimitMatchedOrders); //ok
router.post(`/v/${version}/order/create`, handleOrderCreated); //ok
router.get(`/v/${version}/get/fee`, getFeeSet);

router.get("/", function (req, res) {
  res.send("hello world");
});

export default router;