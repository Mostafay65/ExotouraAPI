import express from "express";
import globalErrorHandler from "./controllers/errorController.js";

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

// Undefined routes
app.all("*", async (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server.`, 404));
});

// Manage all errors
app.use(globalErrorHandler);
