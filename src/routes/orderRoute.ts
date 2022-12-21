import express from "express";
import { getAllTokens } from "../controllers/genController";
import { handleMarginOrderCreated } from "../controllers/marginOrderController";
import { handleOrderCreated, getLimitMatchedOrders, getMatchedMarketOrders } from "../controllers/orderController";

const router = express.Router();




router.get("/tokens", getAllTokens); //ok
router.get("/order/market/matched/:pairId", getMatchedMarketOrders);//ok
router.get("/order/limit/matched/:pairId", getLimitMatchedOrders); //ok
router.post("/order/create", handleOrderCreated); //ok
router.post("/order/margin/create", handleMarginOrderCreated)

router.get("/", function (req, res) {
  res.send("hello world");
});

export default router;