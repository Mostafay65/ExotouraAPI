import "dotenv/config";
import { app } from "./app.js";
import connectDB from "./configurations/databaseConnection.js";
import mongoose from "mongoose";
import "./jobs/paymentReauthorization.js";
import http from "http";
import { initializeSocket } from "./services/socketService.js";

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

connectDB();

mongoose.connection.once("open", () => {
  console.log("DB connected successfully!");

  // Initialize Socket.io
  initializeSocket(server);

  // Start the server
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
  });
});
