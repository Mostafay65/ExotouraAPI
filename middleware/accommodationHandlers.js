import filterBody from "../utilities/filterBody.js";
import AppError from "../utilities/appError.js";

export const filterAccommodationBody = (req, res, next) => {
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

  if (req.body.facilities)
    req.body.facilities = req.body.facilities.split(",").map((item) => item.trim());
  if (req.body.accessibilityFeatures)
    req.body.accessibilityFeatures = req.body.accessibilityFeatures
      .split(",")
      .map((item) => item.trim());
  if (req.body.houseRules)
    req.body.houseRules = req.body.houseRules.split(",").map((item) => item.trim());

  if (req.files.length !== 0) req.body.images = [];
  req.files.forEach((file) => {
    if (file && file.path) {
      req.body.images.push(file.path);
    }
  });

  req.body = filterBody(
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
    "houseRules",
    "images"
  );

  req.body.owner = req.user._id;
  next();
};
