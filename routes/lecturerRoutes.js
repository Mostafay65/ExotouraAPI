import { Router } from "express";
import {
  registerLecturer,
  getAllEventLecturerRequests,
  acceptOrRejectLecturerRequest,
} from "../controllers/eventController.js";
import authorize from "../middleware/authorize.js";
import upload from "../middleware/imageUploader.js";
import { lecturerRequestSchema } from "../validations/roleRequests.validation.js";
import { validate } from "../middleware/validation.js";

const lecturerRouter = Router();

lecturerRouter.use(authorize);

// Lecturer registration
lecturerRouter.post(
  "/:id",
  upload.fields([
    { name: "userPicture", maxCount: 1 },
    { name: "idCard", maxCount: 1 },
    { name: "attachments", maxCount: 5 },
  ]),
  validate(lecturerRequestSchema),
  registerLecturer
);

// Get all lecturer requests
lecturerRouter.get("/:id/requests", getAllEventLecturerRequests);
// accept or reject lecturer request
lecturerRouter.patch("/:requestId", acceptOrRejectLecturerRequest);

export default lecturerRouter;
