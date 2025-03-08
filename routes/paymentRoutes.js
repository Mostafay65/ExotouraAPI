import express from "express";
import authorize from "../middleware/authorize.js";
import restrictTo from "../middleware/restrictTo.js";
import requireStripeAccount from "../middleware/requireStripeAccount.js";
import {
  cancelPayment,
  capturePayment,
  createPaymentIntent,
  createStripeAccount,
  generateKYCLink,
  getAccountPayments,
  getAccountRevenue,
  getAllPayments,
  getCustomerPayments,
  getPayment,
  getPlatformRevenue,
  withdrawFunds,
} from "../controllers/paymentController.js";
import roles from "../helpers/roles.js";

const router = express.Router();

// Authentication
router.use(authorize);

router.post("/create-account", createStripeAccount);
router.post("/get-verification-link", generateKYCLink);

router.post("/create-intent", createPaymentIntent);
router.post("/cancel", cancelPayment);
router.post("/capture", capturePayment);
router.post("/withdraw", withdrawFunds);

router.get("/customer-activity", getCustomerPayments);

router.get("/account-revenue", requireStripeAccount, getAccountRevenue);
router.get("/account-activity", requireStripeAccount, getAccountPayments);

router.get("/", restrictTo(roles.admin), getAllPayments);
router.get("/revenue", restrictTo(roles.admin), getPlatformRevenue);

router.get("/:id", getPayment);

export default router;
