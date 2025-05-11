import { Server } from "socket.io";
import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";
import AppError from "../utilities/appError.js";
import { promisify } from "util";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

let io;
const userSocketMap = new Map();

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
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(chatId);
    });

    socket.on("send_message", async (messageData) => {
      try {
        const { chatId, content, activityType, activity, participants } = messageData;

        const senderId = socket.user._id;

        let chat = await Chat.findOne({
          _id: chatId,
        });

        if (!chat) {
          // If the chat does not exist, create it in the database
          const allParticipants = Array.from(new Set([...participants, senderId]));
          chat = await Chat.create({
            activityType,
            activity,
            participants: allParticipants,
          });
        }

        const message = await Message.create({
          chat: chat._id,
          sender: senderId,
          content,
          readBy: [senderId],
        });

        await message.populate({
          path: "sender",
          select: "fullName profilePicture",
        });

        chat.participants.forEach((participantId) => {
          const participantSockets = userSocketMap.get(participantId.toString());

          if (participantSockets) {
            participantSockets.forEach((socketId) => {
              io.to(socketId).emit("receive_message", message);
            });
          }
        });

        // io.to(chat._id.toString()).emit("receive_message", message); // Notify all participants of the new message
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Error sending message" });
      }
    });

    socket.on("create_chat", async (chatData) => {
      try {
        const { activityType, activity, participants, isSystemInitiated } = chatData;
        const userId = socket.user._id;

        const allParticipants = Array.from(new Set([...participants, userId]));

        if (isSystemInitiated) {
          // Save the chat in the database for system-initiated chats
          const chat = await Chat.create({
            activityType,
            activity,
            participants: allParticipants,
          });

          await chat.populate({
            path: "participants",
            select: "fullName profilePicture",
          });

          allParticipants.forEach((participantId) => {
            io.to(participantId.toString()).emit("new_chat", chat); // Notify all participants of the new chat
          });
        } else {
          // For user-initiated chats, emit the chat details without saving to the database
          const chat = {
            activityType,
            activity,
            participants: allParticipants,
          };

          allParticipants.forEach((participantId) => {
            io.to(participantId.toString()).emit("new_chat", chat); // Notify all participants of the new chat
          });
        }
      } catch (error) {
        console.error("Error creating chat:", error);
        socket.emit("error", { message: "Error creating chat" });
      }
    });

    socket.on("mark_messages_read", async (data) => {
      try {
        const { chatId } = data;
        const userId = socket.user._id;

        const chat = await Chat.findOne({
          _id: chatId,
          participants: { $in: [userId] },
        });

        if (!chat) {
          socket.emit("error", {
            message: "Chat not found or you are not a participant",
          });
          return;
        }

        await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: userId },
            readBy: { $ne: userId },
          },
          { $push: { readBy: userId } }
        );

        socket.to(chatId).emit("messages_read", { chatId, userId });
      } catch (error) {
        socket.emit("error", { message: "Error marking messages as read" });
      }
    });

    socket.on("typing", async (data) => {
      try {
        const chatId = data.chatId;
        const userId = socket.user._id;
        const fullName = socket.user.fullName;

        // Validate chatId
        if (!chatId || typeof chatId !== "string") {
          socket.emit("error", { message: "Invalid chatId provided" });
          return;
        }

        const chat = await Chat.findOne({
          _id: chatId,
          participants: { $in: [userId] },
        });

        if (!chat || !chat.isActive) {
          socket.emit("error", {
            message: "This chat is no longer active. You cannot type here anymore.",
          });
          return;
        }

        socket.to(chatId).emit("user_typing", { userId, fullName });
      } catch (error) {
        socket.emit("error", { message: "Error in typing event" });
      }
    });

    socket.on("stop_typing", (chatId) => {
      const userId = socket.user._id;
      socket.to(chatId).emit("user_stop_typing", { userId });
    });

    socket.on("disconnect", () => {
      const userId = socket.user._id.toString();
      if (userSocketMap.has(userId)) {
        const sockets = userSocketMap.get(userId);
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          userSocketMap.delete(userId);
        }
      }
    });
  });

  return io;
};

// Function to emit events from outside socket context (e.g., from controllers)
export const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(chatId).emit(event, data);
  }
};

// Function to deactivate a chat (prevent further typing/messaging)
export const deactivateChat = async (chatId) => {
  try {
    const chat = await Chat.findByIdAndUpdate(chatId, { isActive: false }, { new: true });

    if (chat) {
      // Notify all participants that the chat has been deactivated
      io.to(chatId).emit("chat_deactivated", {
        chatId,
        message: "This chat is no longer active. You cannot type here anymore.",
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deactivating chat:", error);
    return false;
  }
};

export const emitToUser = (userId, event, data) => {
  if (io && userSocketMap.has(userId.toString())) {
    userSocketMap.get(userId.toString()).forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  }
};
