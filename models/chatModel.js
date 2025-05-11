import mongoose from "mongoose";
import activityTypes from "../helpers/activityTypes.js";

const chatSchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      enum: {
        values: [...Object.values(activityTypes)],
        message: `Acivity type is either: ${Object.values(activityTypes).join(", ")}.`,
      },
      required: [true, "Activity type is required."],
    },
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "activityType",
      required: [true, "Activity ID is required"],
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Participants are required"],
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isActive: {
      type: Boolean,
      default: true,
      description: "Indicates if typing and sending messages is allowed in this chat",
    },
  },
  { timestamps: true }
);

// Create a compound index to ensure uniqueness for chats
chatSchema.index(
  {
    activityType: 1,
    activity: 1,
  },
  { unique: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
