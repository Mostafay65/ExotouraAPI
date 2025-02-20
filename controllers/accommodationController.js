import Hoster from "../models/hosterModel.js";
import Accommodation from "../models/accommodationModel.js";
import catchAsync from "../utilities/catchAsync.js";
import { dirname, join } from "path";
import fs from "fs";
import {
  getAll,
  getOne,
  createOne,
  isOwnerUpdateOne,
  isOnwerDeleteOne,
} from "./handlerFactory.js";
import AppError from "../utilities/appError.js";
import httpStatusText from "../helpers/httpStatusText.js";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const popOptions = {
  path: "owner",
  select: "profileDescription rating status email phoneNumber fullName profilePicture ",
};

const getAllAccommodations = getAll(Accommodation);
const getAccommodationById = getOne(Accommodation, popOptions);

const createAccommodation = createOne(Accommodation);

const updateAccommodation = isOwnerUpdateOne(Accommodation);

const deleteAccommodation = isOnwerDeleteOne(Accommodation);

const uploadImages = catchAsync(async (req, res, next) => {
  const accommodation = await Accommodation.findById(req.params.id).select("-__v");
  if (!accommodation) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "No accommodation found with that ID.",
    });
  }

  // Delete existing images from both database and filesystem
  if (accommodation.images && accommodation.images.length > 0) {
    // Delete each image file
    for (const imageUrl of accommodation.images) {
      const filename = imageUrl.split("/").pop();
      const imagePath = join(__dirname, "../uploads", filename);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    }
  }
  // Clear images array in database
  accommodation.images = [];
  req.files.forEach((file) => {
    if (file && file.filename) {
      const host = `${req.protocol}://${req.get("host")}`;
      accommodation.images.push(`${host}/uploads/${file.filename}`);
    }
  });
  await accommodation.save();
  return res.json({
    status: httpStatusText.SUCCESS,
    message: "Images uploaded successfully",
    data: accommodation,
  });
});
export default {
  getAllAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  uploadImages,
};
