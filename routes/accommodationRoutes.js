import accommodationController from "../controllers/accommodationController.js";
import Authorize from "../middleware/authorize.js";
import express from "express";
import roles from "../helpers/roles.js";

const router = express.Router();

router.get("/", accommodationController.getAllAccommodations);
router.get("/:id", accommodationController.getAccommodationById);
router.post("/", Authorize(roles.hoster), accommodationController.createAccommodation);
router.put("/:id", Authorize(roles.hoster), accommodationController.updateAccommodation);
router.delete("/:id",Authorize(roles.hoster), accommodationController.deleteAccommodation);

export default router;
