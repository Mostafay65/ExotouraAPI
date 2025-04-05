import express from "express";
import getAllDisabilities from "../controllers/disabilityController.js";
const router = express.Router();

router.get("/", getAllDisabilities);

export default router;
