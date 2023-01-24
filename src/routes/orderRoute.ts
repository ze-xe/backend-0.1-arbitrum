import express from "express";
import { getAllTokens } from "../controllers/genral/getAllToken";
import { getFeeSet } from "../controllers/genral/getFeeSet";
import { getLimitMatchedOrders } from "../controllers/order/limitMatchedOrders";
import { getMatchedMarketOrders } from "../controllers/order/marketMatchedOrder";
import { handleOrderCreated } from "../controllers/order/orderCreated";
import { getLatest, getVersion } from "../helper/chain";
const router = express.Router();


require("dotenv").config()
const version = getVersion(process.env.NODE_ENV!)
router.get(`/v/${version}/tokens`, getAllTokens); //ok
router.get(`/v/${version}/order/market/matched/:pairId`, getMatchedMarketOrders);//ok
router.get(`/v/${version}/order/limit/matched/:pairId`, getLimitMatchedOrders); //ok
router.post(`/v/${version}/order/create`, handleOrderCreated); //ok
router.get(`/v/${version}/get/fee`, getFeeSet);

router.get("/", function (req, res) {
  res.send({
    zexe: version,
    latest: getLatest(process.env.NODE_ENV!)
  });
});

export default router;