import roles from "../helpers/roles.js";
import Place from "../models/placeModel.js";
import AppError from "../utilities/appError.js";
import catchAsync from "../utilities/catchAsync.js";
import { getAll, getOne } from "./handlerFactory.js";

export const createPlace = catchAsync(async (req, res, next) => {
  const place = await Place.create({
    ...req.body,
    createdBy: req.user._id,
    approved: req.user.role.includes(roles.admin),
  });
  return res.status(201).json({
    status: "success",
    message: "Place has been created successfully!",
  });
});

export const getAllPlaces = catchAsync(async (req, res, next) => {
  getAll(Place, [{ path: "createdBy", select: "fullName profilePicture" }], {
    approved: true,
  })(req, res, next);
});

export const getAllPlaceRquests = catchAsync(async (req, res, next) => {
  getAll(Place, [{ path: "createdBy", select: "fullName profilePicture" }], {
    approved: false,
  })(req, res, next);
});

export const approvePlace = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const place = await Place.findOne({ _id: id }).populate(
    "createdBy",
    "fullName profilePicture role"
  );

  if (!place) {
    return next(new AppError("No place found with that ID", 404));
  }
  if (place.approved) {
    return next(new AppError("Place has already been approved", 400));
  }

  place.approved = true;
  await place.save();

  return res.status(200).json({
    status: "success",
    message: "Place has been approved successfully!",
  });
});

export const rejectPlace = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const place = await Place.findOne({ _id: id }).populate(
    "createdBy",
    "fullName profilePicture role"
  );

  if (!place) {
    return next(new AppError("No place found with that ID", 404));
  }
  if (place.approved) {
    return next(new AppError("Place has been approved", 400));
  }

  await Place.findByIdAndDelete(id);

  return res.status(200).json({
    status: "success",
    message: "Place has been rejected successfully!",
  });
});

export const getPlaceById = catchAsync(async (req, res, next) => {
  getOne(Place, [{ path: "createdBy", select: "fullName profilePicture email bio phoneNumber" }])(
    req,
    res,
    next
  );
});

export const deletePlace = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const place = await Place.findById(id);

  if (!place) {
    return next(new AppError("No place found with that ID", 404));
  }

  if (
    !req.user.role.includes(roles.admin) ||
    place.createdBy._id.toString() != req.user._id.toString()
  ) {
    return next(new AppError("You are not authorized to delete this place", 403));
  }

  await Place.findByIdAndDelete(id);

    return res.status(200).json({
        status: "success",
        message: "Place has been deleted successfully!",
    });
});
