import express from "express";
import globalErrorHandler from "./controllers/errorController.js";
import authRouter from "./routes/authRoutes.js";
import accommodationRoutes from "./routes/accommodationRoutes.js";
import accommodationRequestRoutes from "./routes/accommodationRequestRoutes.js";
import userRouter from "./routes/userRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import webhookRouter from "./routes/webhookRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import disabilityRouter from "./routes/disabilityRoutes.js";
import cookieParser from "cookie-parser";
import AppError from "./utilities/appError.js";
import cors from "cors";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import eventRouter from "./routes/eventRoutes.js";
import roleRequestRouter from "./routes/roleRequestRoutes.js";
import corsOptions from "./configurations/corsOptions.js";
import hangoutRouter from "./routes/hangoutRoutes.js";
import volunteerRequestRouter from "./routes/volunteerRequestRoutes.js";
import placeRouter from "./routes/placeRoutes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const app = express();

app.use(cors(corsOptions));
app.use(cookieParser());

// Mount webhook route
app.use("/webhook", webhookRouter);

// Server static files
app.use("/uploads", express.static(join(__dirname, "uploads")));

// Body parser
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/accommodation", accommodationRoutes);
app.use("/users", userRouter);
app.use("/payment", paymentRouter);
app.use("/transaction", transactionRouter);
app.use("/accommodationrequest", accommodationRequestRoutes);
app.use("/event", eventRouter);
app.use("/role-request", roleRequestRouter);
app.use("/disability", disabilityRouter);
app.use("/hangout", hangoutRouter);
app.use("/volunteer-request", volunteerRequestRouter);
app.use("/place", placeRouter);

// Undefined routes
app.all("*", async (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server.`, 404));
});

// Manage all errors
app.use(globalErrorHandler);
