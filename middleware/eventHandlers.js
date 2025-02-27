import filterBody from "../utilities/filterBody.js";
import AppError from "../utilities/appError.js";
import Event from "../models/eventModel.js";
import mongoose from "mongoose";

export const filterEvent = (req, res, next) => {
  if (req.body.from && req.body.to) {
    if (req.body.from >= req.body.to) {
      return next(new AppError("Check-out date must be after check-in date", 400));
    }

    if (req.body.from < new Date().setHours(0, 0, 0, 0)) {
      return next(new AppError("Check-in date cannot be in the past", 400));
    }

    req.body.availability = {
      from: req.body.from,
      to: req.body.to,
    };
  }
  
  if (req.body.location) {
    req.body.location = {
      coordinates: req.body.location.split(",").map((coord) => Number(coord.trim())),
    };
  }

  if (req.body.accessibilityFeatures)
    req.body.accessibilityFeatures = req.body.accessibilityFeatures
      .split(",")
      .map((item) => item.trim());

  if (req.method === "POST") req.body._id = new mongoose.Types.ObjectId();
  else req.body._id = req.params.id;

  req.body.images = [];

  if (req.imageUploadPromises?.length > 0) {
    req.body.images = req.files.map(() => "uploading...");

    setImmediate(async () => {
      try {
        const uploadedUrls = await Promise.all(req.imageUploadPromises);
        await Event.findByIdAndUpdate(req.body._id, { images: uploadedUrls });
      } catch (error) {
        await Event.findByIdAndUpdate(req.body._id, {
          images: [`❌ Image upload failed: ${error.message}`],
        });
      }
    });
  }

  req.body = filterBody(
    req.body,
    "_id",
    "name",
    "description",
    "price",
    "maxCapacity",
    "availability",
    "location",
    "accessibilityFeatures",
    "status",
    "images",
    "type"
  );

  req.body.owner = req.user._id;
  next();
};
