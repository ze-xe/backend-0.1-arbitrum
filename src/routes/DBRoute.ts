import express from "express";
import { DBStatus } from "../controllers/DB/dbStatus";
import { fetchDBRecords } from "../controllers/DB/fetchRecord";
import { getVersion } from "../helper/chain";

require("dotenv").config()
const router = express.Router();

router.get(`/v/${getVersion(process.env.NODE_ENV!)}/DB/status`, DBStatus); //ok
router.get(`/v/${getVersion(process.env.NODE_ENV!)}/DB/fetch/record`, fetchDBRecords)

export default router;