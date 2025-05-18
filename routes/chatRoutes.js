import express from "express";
import { getUserChats, getChatById } from "../controllers/chatController.js";
import authorize from "../middleware/authorize.js";
import { createGroupChat } from "../services/socketService.js";
import httpStatusText from "../helpers/httpStatusText.js";

const router = express.Router();

router.use(authorize);

// Chat routes
router.route("/").get(getUserChats);

router.route("/:id").get(getChatById);

router.route("/group").post(async (req, res, next) => {
  createGroupChat({
    name: "kafr el shiekh group",
    participantIds: ["67c258a5e95b4324ec16fef8", "67f0e627a661995398d50b66"],
  });
  res.status(200).json({
    status: httpStatusText.SUCCESS,
  });
});

export default router;
