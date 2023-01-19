import express from "express";
import { getAllTokens } from "../controllers/genral/getAllToken";
import { getFeeSet } from "../controllers/genral/getFeeSet";
import { getLimitMatchedOrders } from "../controllers/order/limitMatchedOrders";
import { getMatchedMarketOrders } from "../controllers/order/marketMatchedOrder";
import { handleOrderCreated } from "../controllers/order/orderCreated";
import { getVersion } from "../helper/chain";
import { getConfig } from "../helper/constant";


const router = express.Router();


require("dotenv").config()
const version = process.env.NODE_ENV!
router.get(`/v/${getVersion(version)}/tokens`, getAllTokens); //ok
router.get(`/v/${getVersion(version)}/order/market/matched/:pairId`, getMatchedMarketOrders);//ok
router.get(`/v/${getVersion(version)}/order/limit/matched/:pairId`, getLimitMatchedOrders); //ok
router.post(`/v/${getVersion(version)}/order/create`, handleOrderCreated); //ok
router.get(`/v/${getVersion(version)}/get/fee`, getFeeSet);

router.get("/", function (req, res) {
  res.send({
    zexe: getConfig("version"),
    latest: getConfig("latest")
  });
});

export default router;