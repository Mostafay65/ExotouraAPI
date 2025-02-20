import accommodationController from "../controllers/accommodationController.js";
import Authorize from "../middleware/authorize.js";
import express from "express";
import roles from "../helpers/roles.js";
import multer from "multer";
import restrictTo from "../middleware/restrictTo.js";
import { filterAccommodationBody } from "../middleware/accommodationHandelers.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const filePath = __dirname + "../Uploads";
    cb(null, filePath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

router.get("/", accommodationController.getAllAccommodations);
router.get("/:id", accommodationController.getAccommodationById);

router.use(Authorize, restrictTo(roles.hoster));

router.post("/", filterAccommodationBody, accommodationController.createAccommodation);
router.patch("/:id", filterAccommodationBody, accommodationController.updateAccommodation);
router.delete("/:id", accommodationController.deleteAccommodation);

export default router;
