import accommodationController from "../controllers/accommodationController.js";
import Authorize from "../middleware/authorize.js";
import express from "express";
import roles from "../helpers/roles.js";
import multer from "multer";
import restrictTo from "../middleware/restrictTo.js";
import { filterAccommodationBody } from "../middleware/accommodationHandlers.js";
import imageUploader from "../utilities/imageUploader.js"

const router = express.Router();

router.get("/", accommodationController.getAllAccommodations);
router.get("/:id", accommodationController.getAccommodationById);

router.use(Authorize, restrictTo(roles.hoster));

router.post("/", filterAccommodationBody, accommodationController.createAccommodation);
router.patch("/:id", filterAccommodationBody, accommodationController.updateAccommodation);

router.patch("/:id/images", imageUploader.array("images", 5), accommodationController.uploadImages);

router.delete("/:id", accommodationController.deleteAccommodation);

export default router;
