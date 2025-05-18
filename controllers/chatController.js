import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import catchAsync from "../utilities/catchAsync.js";
import AppError from "../utilities/appError.js";
import httpStatusText from "../helpers/httpStatusText.js";

// Get all chats for a user
export const getUserChats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const chats = await Chat.find({
    participants: { $in: [userId] },
  })
    .populate({
      path: "participants",
      select: "fullName profilePicture",
    })
    .populate({
      path: "lastMessage",
      select: "content createdAt readBy",
      populate: {
        path: "sender",
        select: "fullName",
      },
    })
    .sort({ updatedAt: -1 });

  // Add unread message count for each chat
  const chatsWithUnreadCount = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      });
      return { ...chat.toObject(), unreadCount };
    })
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: chatsWithUnreadCount.length,
    data: {
      chats: chatsWithUnreadCount,
    },
  });
});

// Get a specific chat with its messages
export const getChatById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if chat exists and user is a participant
  const chat = await Chat.findOne({
    _id: id,
    participants: { $in: [userId] },
  }).populate({
    path: "participants",
    select: "fullName profilePicture",
  });

  if (!chat) {
    return next(new AppError("Chat not found or you are not a participant", 404));
  }

  // Get messages for this chat
  const messages = await Message.find({ chat: id })
    .populate({
      path: "sender",
      select: "fullName profilePicture",
    })
    .sort({ createdAt: 1 });

  // Mark messages as read by this user
  const unreadMessages = messages.filter(
    (message) =>
      message.sender && // <-- add this line
      message.sender._id.toString() !== userId.toString() &&
      !message.readBy.includes(userId)
  );

  if (unreadMessages.length > 0) {
    await Message.updateMany(
      {
        _id: { $in: unreadMessages.map((msg) => msg._id) },
        readBy: { $ne: userId },
      },
      { $push: { readBy: userId } }
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      chat,
      messages,
    },
  });
});
