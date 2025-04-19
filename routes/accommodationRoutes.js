import {
  getAllAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  getAccommodationsOnMap,
  getNearbyAccommodations
} from "../controllers/accommodationController.js";
import Authorize from "../middleware/authorize.js";
import express from "express";
import roles from "../helpers/roles.js";
import restrictTo from "../middleware/restrictTo.js";
import { filterAccommodationBody } from "../middleware/accommodationHandlers.js";
import AppError from "../utilities/appError.js";
import accommodationRequestRoutes from "./accommodationRequestRoutes.js";
import upload from "../middleware/imageUploader.js";

const router = express.Router({ mergeParams: true }); // Enable mergeParams

router.use("/:id/requests", accommodationRequestRoutes);

router.get("/", getAllAccommodations);
router.get("/map", getAccommodationsOnMap);
router.get("/near", getNearbyAccommodations);
router.get("/:id", getAccommodationById);

router.use(Authorize, restrictTo(roles.hoster));

router.delete("/:id", deleteAccommodation);

router.post(
  "/",
  upload.array("images", 15),
  filterAccommodationBody,
  createAccommodation
);
router.patch(
  "/:id",
  upload.array("images", 15),
  filterAccommodationBody,
  updateAccommodation
);

export default router;
