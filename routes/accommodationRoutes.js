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
import AppError from "../utilities/appError.js";
import accommodationRequestRoutes from "./accommodationRequestRoutes.js";

const router = express.Router({ mergeParams: true }); // Enable mergeParams

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Only image files are allowed!", 400), false);
    }
    cb(null, true);
  },
});

router.use("/:id/requests", accommodationRequestRoutes);

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
