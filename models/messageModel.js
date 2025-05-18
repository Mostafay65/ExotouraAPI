import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat ID is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderType: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Add index for efficient querying
messageSchema.index({ chat: 1, createdAt: -1 });

// Update the last message in the chat when a new message is created
messageSchema.post("save", async function () {
  try {
    await mongoose.model("Chat").findByIdAndUpdate(this.chat, {
      lastMessage: this._id,
    });
  } catch (error) {
    console.error("Error updating last message in chat:", error);
  }
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
