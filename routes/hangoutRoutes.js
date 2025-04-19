import { Router } from "express";
import authorize from "../middleware/authorize.js";
import {
  createHangout,
  getAllHangouts,
  getHangoutById,
  deleteHangout,
  participateInHangout,
  cancelParticipationInHangout,
  getParticipationStatus,
} from "../controllers/hangoutController.js";
import upload from "../middleware/imageUploader.js";
import {
  createHangoutSchema,
  deleteHangoutSchema,
  getHangoutSchema,
} from "../validations/hangout.validation.js";
import { validate, validateHangout } from "../middleware/validation.js";

const router = Router();

// create hangout
router.post(
  "/",
  authorize,
  upload.array("images", 15),
  validateHangout(createHangoutSchema),
  createHangout
);
// get all hangouts
router.get("/", getAllHangouts);

// get hangout by id
router.get("/:id", validateHangout(getHangoutSchema), getHangoutById);

//delete hangout
router.delete("/:id", authorize, validateHangout(deleteHangoutSchema), deleteHangout);

// paricipate in hangout
router.post(
  "/participate/:id",
  authorize,
  validateHangout(getHangoutSchema),
  participateInHangout
);

// cancel participation in hangout
router.post(
  "/cancel/:id",
  authorize,
  validateHangout(getHangoutSchema),
  cancelParticipationInHangout
);

// get participant status
router.get(
  "/participation-status/:id",
  authorize,
  validateHangout(getHangoutSchema),
  getParticipationStatus
);
export default router;
