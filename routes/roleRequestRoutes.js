import { Router } from "express";
import authorize from "../middleware/authorize.js";
import upload from "../middleware/imageUploader.js";
import {
  requestRole,
  getAllRequests,
  getSpecificRequest,
  deleteRequest,
  approveRequest,
  rejectRequest,
  getUserRequests,
} from "../controllers/roleRequsetController.js";
import { idSchema, requestRoleSchema } from "../validations/roleRequests.validation.js";
import { validate } from "../middleware/validation.js";
import restrictTo from "../middleware/restrictTo.js";
import roles from "../helpers/roles.js";
const router = Router();

router.post(
  "/",
  authorize,
  upload.fields([
    { name: "userPicture", maxCount: 1 },
    { name: "idCard", maxCount: 1 },
    { name: "attachments", maxCount: 1 },
  ]),
  validate(requestRoleSchema),
  requestRole
);

router.use(authorize, restrictTo(roles.admin));

// get All requests
router.get("/", getAllRequests);

// get specific request
router.get("/:id", validate(idSchema), getSpecificRequest);

// delete specific request
router.delete("/:id", validate(idSchema), deleteRequest);

// approve specific request
router.patch("/approve/:id", validate(idSchema), approveRequest);

// reject specific request
router.patch("/reject/:id", validate(idSchema), rejectRequest);

// get user's requests
router.get("/user/:id", validate(idSchema), getUserRequests);

export default router;
