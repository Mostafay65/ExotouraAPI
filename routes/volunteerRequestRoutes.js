import express from "express";
import {
  getAllVolunteerRequests,
  getVolunteerRequest,
  createVolunteerRequest,
  updateVolunteerRequestStatus,
  assignVolunteer,
  getMyRequests,
  getMyAssignedRequests,
} from "../controllers/volunteerRequestController.js";
import authorize from "../middleware/authorize.js";
import restrictTo from "../middleware/restrictTo.js";
import roles from "../helpers/roles.js";
import upload from "../middleware/imageUploader.js";
const router = express.Router();

// public routes
router.route("/").get(getAllVolunteerRequests);

// Protect all routes after this middleware
router.use(authorize);

// Routes for regular users
router.get("/my-requests", getMyRequests);
router.post("/", createVolunteerRequest);

// Routes for volunteers
router.get("/my-assigned-requests", restrictTo(roles.volunteer), getMyAssignedRequests);

router
  .route("/:id")
  .get(getVolunteerRequest)
  .patch(
    restrictTo(roles.volunteer),
    upload.array("images", 5),
    updateVolunteerRequestStatus
  );

router.patch("/:id/assign", restrictTo(roles.volunteer), assignVolunteer);

export default router;
