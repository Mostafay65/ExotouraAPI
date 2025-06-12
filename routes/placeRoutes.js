import Router from "express";
import authorize from "../middleware/authorize.js";
import upload from "../middleware/imageUploader.js";
import {
  approvePlace,
  createPlace,
  deletePlace,
  getAllPlaceRquests,
  getAllPlaces,
  getPlaceById,
  rejectPlace,
} from "../controllers/placeController.js";
import { validatePlace } from "../middleware/validation.js";
import { createPlaceSchema } from "../validations/place.validation.js";
import restrictTo from "../middleware/restrictTo.js";
import roles from "../helpers/roles.js";

const router = Router();
// Create place
router.post(
  "/",
  authorize,
  upload.array("images", 15),
  // validatePlace(createPlaceSchema),
  createPlace
);
// Get all places (Approved)
router.get("/", getAllPlaces);
// get Place requests
router.get("/requests", authorize, restrictTo(roles.admin), getAllPlaceRquests);
// approve request
router.patch("/approve/:id", authorize, restrictTo(roles.admin), approvePlace);
// reject request
router.delete("/reject/:id", authorize, restrictTo(roles.admin), rejectPlace);
// get specific place
router.get("/:id", getPlaceById);
// delete a place
router.delete("/:id", authorize, deletePlace);

export default router;
