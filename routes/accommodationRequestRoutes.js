import express from "express";

import {
  getAllUserAccommodationRequests,
  getAllAccommodationRequests,
  getAccommodationRequest,
  createAccommodationRequest,
  updateAccommodationRequest,
  deleteAccommodationRequest,
} from "../controllers/accommodationRequestController.js";
import authorize from "../middleware/authorize.js";
import restrictTo from "../middleware/restrictTo.js";
import roles from "../helpers/roles.js";

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getAllAccommodationRequests)
  .post(authorize, createAccommodationRequest);

router
 .route("/user")
 .get(authorize, getAllUserAccommodationRequests);
 
router
  .route("/:id")
  .get(getAccommodationRequest)
  .patch(authorize, updateAccommodationRequest)
  .delete(authorize, deleteAccommodationRequest);

export default router;
