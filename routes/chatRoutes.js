import express from "express";
import { createChat, getUserChats, getChatById } from "../controllers/chatController.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.use(authorize);

// Chat routes
router.route("/").post(createChat).get(getUserChats);

router.route("/:id").get(getChatById);

export default router;
