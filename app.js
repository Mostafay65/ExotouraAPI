import express from "express";
import globalErrorHandler from "./controllers/errorController.js";
import authRouter from "./routes/authRoutes.js";
import accommodationRoutes from "./routes/accommodationRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import AppError from "./utilities/appError.js";

import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const app = express();

app.use(cookieParser());

// Server static files
app.use(express.static(join(__dirname, "/uploads")));

// Body parser
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/accommodation", accommodationRoutes);
app.use("/users", userRouter);

// Undefined routes
app.all("*", async (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server.`, 404));
});

// Manage all errors
app.use(globalErrorHandler);
