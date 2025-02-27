import { Router } from "express";
import multer from "multer";
import { processImages } from "../middleware/processImages.js";
import { createEvent, deleteEvent , updateEvent , getAllEvents, getEventById } from "../controllers/eventController.js";
import authorize from "../middleware/authorize.js";
import restrictTo from "../middleware/restrictTo.js";
import roles from "../helpers/roles.js";
import { filterEvent } from "../middleware/eventHandlers.js";

const router = Router();

//
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Only image files are allowed!", 400), false);
    }
    cb(null, true);
  },
});

router.get("/", getAllEvents);
router.get("/:id", getEventById);


router.use(authorize, restrictTo(roles.organizer));

// Create an event
router.post("/", upload.array("images", 5), processImages, filterEvent, createEvent);

// Delete an event
router.delete("/:id", deleteEvent);

// update an event
router.patch("/:id", upload.array("images", 5), processImages, filterEvent, updateEvent);



export default router;
