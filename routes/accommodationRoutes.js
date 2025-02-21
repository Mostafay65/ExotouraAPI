import {
  getAllAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
} from "../controllers/accommodationController.js";
import Authorize from "../middleware/authorize.js";
import express from "express";
import multer from "multer";
import roles from "../helpers/roles.js";
import restrictTo from "../middleware/restrictTo.js";
import { filterAccommodationBody } from "../middleware/accommodationHandlers.js";
import { processImages } from "../middleware/processImages.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", getAllAccommodations);
router.get("/:id", getAccommodationById);

router.use(Authorize, restrictTo(roles.hoster));

router.delete("/:id", deleteAccommodation);

router.post(
  "/",
  upload.array("images", 5),
  processImages,
  filterAccommodationBody,
  createAccommodation
);
router.patch(
  "/:id",
  upload.array("images", 5),
  processImages,
  filterAccommodationBody,
  updateAccommodation
);

export default router;
