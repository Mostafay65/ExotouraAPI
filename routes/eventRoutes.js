import { Router } from "express";
import { createEvent, deleteEvent , updateEvent , getAllEvents, getEventById } from "../controllers/eventController.js";
import authorize from "../middleware/authorize.js";
import restrictTo from "../middleware/restrictTo.js";
import roles from "../helpers/roles.js";
import { filterEvent } from "../middleware/eventHandlers.js";
import upload from "../middleware/imageUploader.js";
const router = Router();

router.get("/", getAllEvents);
router.get("/:id", getEventById);


router.use(authorize, restrictTo(roles.organizer));

// Create an event
router.post("/", upload.array("images", 5), filterEvent, createEvent);

// Delete an event
router.delete("/:id", deleteEvent);

// update an event
router.patch("/:id", upload.array("images", 5), filterEvent, updateEvent);



export default router;
