import roles from "../helpers/roles.js";
import Hangout from "../models/hangoutModel.js";
import AppError from "../utilities/appError.js";
import catchAsync from "../utilities/catchAsync.js";
import { getAll, getOne } from "./handlerFactory.js";

export const createHangout = catchAsync(async (req, res, next) => {
  const { _id: userId } = req.user;
  const data = {
    ...req.body,
    createdBy: userId,
  };
  const hangout = await Hangout.create(data);

  if (!hangout) {
    return next(new AppErrorpError("Failed to create hangout.", 400));
  }

  return res.status(201).json({
    status: "success",
    message: "Hangout has been created successfully!",
  });
});

export const getAllHangouts = catchAsync(async (req, res, next) => {
  getAll(Hangout, [{ path: "createdBy", select: "fullName profilePicture" }], {})(
    req,
    res,
    next
  );
});

export const getHangoutById = getOne(Hangout, [
  { path: "createdBy", select: "fullName profilePicture" },
]);

export const deleteHangout = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const hangout = await Hangout.findById(id).populate(
    "createdBy",
    "fullName profilePicture role"
  );
  if (!hangout) {
    return next(new AppError("No hangout found with that ID.", 404));
  }

  if (
    !hangout.createdBy.role.includes(roles.admin) ||
    hangout.createdBy._id.toString() != req.user._id.toString()
  ) {
    return next(new AppError("You are not authorized to delete this hangout.", 403));
  }

  await Hangout.findByIdAndDelete(id);

  return res.status(200).json({
    status: "success",
    message: "Hangout has been deleted successfully!",
  });
});

export const participateInHangout = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const hangout = await Hangout.findById(id);
  if (!hangout) {
    return next(new AppError("No hangout found with that ID.", 404));
  }

  if (hangout.participants.includes(req.user._id)) {
    return next(new AppError("You have already participated in this hangout.", 400));
  }

  await Hangout.findByIdAndUpdate(id, {
    $push: { participants: req.user._id },
  });

  return res.status(200).json({
    status: "success",
    message: "You have successfully participated in this hangout.",
  });
});

export const cancelParticipationInHangout = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const hangout = await Hangout.findById(id);
  if (!hangout) {
    return next(new AppError("No hangout found with that ID.", 404));
  }

  if (!hangout.participants.includes(req.user._id)) {
    return next(new AppError("You have not participated in this hangout.", 400));
  }

  await Hangout.findByIdAndUpdate(id, {
    $pull: { participants: req.user._id },
  });

  return res.status(200).json({
    status: "success",
    message: "You have successfully cancelled your participation in this hangout.",
  });
});

export const getParticipationStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const hangout = await Hangout.findById(id);
  if (!hangout) {
    return next(new AppError("No hangout found with that ID.", 404));
  }

  if (hangout.participants.includes(req.user._id)) {
    return res.status(200).json({
      status: "success",
      participate: true,
      message: "You are participating in this hangout.",
    });
  } else {
    return res.status(200).json({
      status: "success",
      participate: false,
      message: "You are not participating in this hangout.",
    });
  }
});
