import express from "express";
import {
  signup,
  resendVerificationCode,
  verifyEmail,
  signin,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateEmail,
  updatePassword,
  logout,
} from "../controllers/authController.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/resendcode", resendVerificationCode);
router.post("/verifyemail/:code", verifyEmail);
router.post("/login", signin);
router.get("/refresh", refreshToken);
router.patch("/resetpassword/:code", resetPassword);
router.post("/forgotpassword", forgotPassword);

router.use(authorize);

router.patch("/updateemail", updateEmail);
router.patch("/updatepassword", updatePassword);
router.post("/logout", logout);

export default router;
