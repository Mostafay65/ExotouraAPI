import Hoster from "../models/hosterModel.js";
import Accommodation from "../models/accommodationModel.js";
import catchAsync from "../utilities/catchAsync.js";
import {
  getAll,
  getOne,
  deleteOne,
  isOwnerUpdateOne,
  isOnwerDeleteOne,
} from "./handlerFactory.js";
import AppError from "../utilities/appError.js";
import httpStatusText from "../helpers/httpStatusText.js";
import filterBody from "../utilities/filterBody.js";

const getAllAccommodations = getAll(Accommodation);
const getAccommodationById = getOne(Accommodation, {
  path: "owner",
  select: "profileDescription rating status email phoneNumber fullName profilePicture ",
});

const createAccommodation = catchAsync(async (req, res, next) => {
  // Validate availability dates
  if (req.body.availability) {
    const from = new Date(req.body.availability.from);
    const to = new Date(req.body.availability.to);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return next(new AppError("Invalid date format for availability", 400));
    }

    if (from >= to) {
      return next(new AppError("Check-out date must be after check-in date", 400));
    }

    if (from < new Date().setHours(0, 0, 0, 0)) {
      return next(new AppError("Check-in date cannot be in the past", 400));
    }
  }

  const accommodation = filterBody(
    req.body,
    "name",
    "description",
    "price",
    "deposit",
    "location",
    "maxCapacity",
    "availability",
    "spaceOffered",
    "facilities",
    "accessibilityFeatures",
    "houseRules"
  );
  accommodation.owner = req.user.id;

  const newAccommodation = await Accommodation.create(accommodation);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Accommodation created successfully",
    data: {
      accommodation: newAccommodation.toObject({ versionKey: false }),
    },
  });
});

const updateAccommodation = isOwnerUpdateOne(Accommodation);

const deleteAccommodation = isOnwerDeleteOne(Accommodation);

export default {
  getAllAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
};
