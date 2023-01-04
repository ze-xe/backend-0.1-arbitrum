import express from "express";
import { DBStatus, fetchDBRecords } from "../controllers/dbController";

const router = express.Router();

router.get("/DB/status", DBStatus); //ok
router.get("/DB/fetch/record", fetchDBRecords)

export default router;