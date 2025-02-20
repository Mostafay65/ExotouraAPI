import filterBody from "../utilities/filterBody.js";

export const filterAccommodationBody = (req, res, next) => {
  if (req.body.availability) {
    const from = new Date(req.body.availability.from);
    const to = new Date(req.body.availability.to);

    if (from >= to) {
      return next(new AppError("Check-out date must be after check-in date", 400));
    }

    if (from < new Date().setHours(0, 0, 0, 0)) {
      return next(new AppError("Check-in date cannot be in the past", 400));
    }
  }

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
    "houseRules"
  );

  req.body.owner = req.user._id;
  next();
};
