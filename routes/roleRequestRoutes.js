import { Router } from "express";
import authorize from "../middleware/authorize.js";
import upload from "../middleware/imageUploader.js";
import { requestRole } from "../controllers/roleRequsetController.js";
import { requestRoleSchema } from "../validations/roleRequests.validation.js";
import { validate } from "../middleware/validation.js";
const router = Router();


router.post("/",authorize ,upload.array("attachments", 10),validate(requestRoleSchema) , requestRole);


export default router;
