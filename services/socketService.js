import { Server } from "socket.io";
import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";
import AppError from "../utilities/appError.js";
import { promisify } from "util";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://yourdomain.com"],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new AppError("Authentication error: No token provided", 401));
      }

      const decoded = await promisify(jwt.verify)(token, process.env.ACCESS_TOKEN_SECRET);

      const currentUser = await User.findById(decoded.userInfo.id);

      if (!currentUser) {
        return next(new Error("Authentication error: User no longer exists"));
      }

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new Error("Authentication error: Password changed recently"));
      }

      if (currentUser.emailStatus !== "verified") {
        return next(new Error("Authentication error: Email not verified"));
      }

      socket.user = currentUser;

      next();
    } catch (err) {
      console.error("Socket auth error:", err);
      next(new AppError("Authentication error", 401));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);

    socket.on("send_message", async (data) => {
      let { chatId, clientTempId, participants = [], content } = data;
      const senderId = socket.user._id.toString();

      if (!content?.trim()) return;

      if (participants.length && !participants.includes(senderId)) {
        participants.push(senderId);
      }

      try {
        let chat;
        let isNewChat = false;

        if (!chatId) {
          chat = await Chat.findOne({
            participants: { $all: participants },
            isGroup: participants.length > 2,
          }).populate({
            path: "participants",
            select: "fullName profilePicture",
          });

          if (!chat) {
            if (participants.length !== 2) return;
            if (!participants.includes(senderId)) return;

            chat = await Chat.create({
              participants,
              isGroup: participants.length > 2,
            });

            isNewChat = true;

            // Repopulate after creation
            chat = await Chat.findById(chat._id).populate({
              path: "participants",
              select: "fullName profilePicture",
            });
          }

          chatId = chat._id.toString();
        } else {
          chat = await Chat.findById(chatId).populate({
            path: "participants",
            select: "fullName profilePicture",
          });

          if (!chat) return;
          if (!chat.participants.map((p) => p._id.toString()).includes(senderId)) return;
        }

        const message = await Message.create({
          chat: chat._id,
          sender: socket.user,
          content,
          readBy: [senderId],
        });

        await Chat.findByIdAndUpdate(chat._id, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        const payload = {
          chat: {
            _id: chat._id,
            participants: chat.participants,
            isGroup: chat.isGroup,
            isActive: chat.isActive,
            lastMessage: message,
          },
          message,
          isNewChat,
          clientTempId,
        };

        chat.participants.forEach((participant) => {
          io.to(participant._id.toString()).emit("incoming_chat_message", payload);
        });
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", async ({ chatId }) => {
      if (!chatId) return;
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      chat.participants.forEach((participant) => {
        if (participant.toString() !== socket.user._id.toString()) {
          io.to(participant.toString()).emit("user_typing", {
            chatId,
            userId: socket.user._id,
          });
        }
      });
    });

    socket.on("stop_typing", async ({ chatId }) => {
      if (!chatId) return;
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      chat.participants.forEach((participant) => {
        if (participant.toString() !== socket.user._id.toString()) {
          io.to(participant.toString()).emit("user_stopped_typing", {
            chatId,
            userId: socket.user._id,
          });
        }
      });
    });

    socket.on("mark_messages_read", async ({ chatId }) => {
      const userId = socket.user._id;

      const chat = await Chat.findOne({
        _id: chatId,
        participants: { $in: [userId] },
      });

      if (!chat) return;

      await Message.updateMany(
        {
          chat: chatId,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        },
        { $push: { readBy: userId } }
      );

      // Notify all participants about messages being read
      chat.participants.forEach((participant) => {
        io.to(participant.toString()).emit("messages_read", {
          chatId,
          userId: userId.toString(),
        });
      });
    });
  });

  return io;
};

export async function createGroupChat({ name, participantIds, groupPicture }) {
  if (!name || !Array.isArray(participantIds) || participantIds.length < 2) {
    throw new AppError("Group name and at least 2 participants are required", 400);
  }

  const participants = await User.find({
    _id: { $in: participantIds },
    emailStatus: "verified",
  });

  if (participants.length < 2) {
    throw new AppError("At least two valid, verified users must be provided", 400);
  }

  let chat = await Chat.create({
    name,
    groupPicture,
    participants: participants.map((p) => p._id),
    isGroup: true,
  });

  chat = await Chat.findById(chat._id).populate(
    "participants",
    "fullName profilePicture"
  );

  const systemMessage = await Message.create({
    chat: chat._id,
    sender: null,
    senderType: "system",
    content: `You were added to the group chat: ${name}`,
    readBy: [],
  });

  await Chat.findByIdAndUpdate(chat._id, {
    lastMessage: systemMessage._id,
    updatedAt: new Date(),
  });

  const payload = {
    chat: {
      _id: chat._id,
      name: chat.name,
      groupPicture: chat.groupPicture,
      participants: chat.participants,
      isGroup: true,
      isActive: chat.isActive,
      lastMessage: systemMessage,
    },
    message: systemMessage,
    isNewChat: true,
  };

  chat.participants.forEach((participant) => {
    io.to(participant._id.toString()).emit("incoming_chat_message", payload);
  });

  return chat;
}
