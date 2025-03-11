import express from "express";
import {
  getAllTransactions,
  getCustomerTransactions,
} from "../controllers/transactionController.js";
import authorize from "../middleware/authorize.js";
import restrictTo from "../middleware/restrictTo.js";
import roles from "../helpers/roles.js";

const router = express.Router();

// Authentication
router.use(authorize);

router.get("/", restrictTo(roles.admin), getAllTransactions);

router.get("/customer-activity", getCustomerTransactions);

export default router;
