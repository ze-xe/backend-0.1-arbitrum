import express from "express";
import { DBStatus, fetchDBRecords } from "../controllers/dbController";
import { version } from "../helper/constant";

const router = express.Router();

router.get(`/v/${version}/DB/status`, DBStatus); //ok
router.get(`/v/${version}/DB/fetch/record`, fetchDBRecords)

export default router;