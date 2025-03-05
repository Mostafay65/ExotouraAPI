import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  updateEvent,
  getAllEvents,
  getEventById,
  registerEvent,
  cancelRegistration,
  checkEventRegistration,
  getUserEvents,
  getOrganizerEvents,
} from "../controllers/eventController.js";
import authorize from "../middleware/authorize.js";
import restrictTo from "../middleware/restrictTo.js";
import roles from "../helpers/roles.js";
import { filterEvent } from "../middleware/eventHandlers.js";
import upload from "../middleware/imageUploader.js";
const router = Router();

// Get user's events
router.get("/user", authorize, getUserEvents);

// get Organizer's events
router.get("/organizer", authorize, restrictTo(roles.organizer), getOrganizerEvents);

// Get all events
router.get("/", getAllEvents);

// Get a specific event
router.get("/:id", getEventById);

router.use(authorize);

//register an event
router.post("/register/:id", registerEvent);

//cancel registration for an event
router.post("/cancel-registration/:id", cancelRegistration);

// check registration status
router.get("/registration-status/:id", checkEventRegistration);

router.use(authorize, restrictTo(roles.organizer));

// Create an event
router.post("/", upload.array("images", 5), filterEvent, createEvent);

// Delete an event
router.delete("/:id", deleteEvent);

// update an event
router.patch("/:id", upload.array("images", 5), filterEvent, updateEvent);

export default router;
