import httpStatusText from "../helpers/httpStatusText.js";
import requestStatus from "../helpers/requestStatus.js";
import roleRequestModel from "../models/roleRequestModel.js";
import User from "../models/userModel.js";
import AppError from "../utilities/appError.js";
import catchAsync from "../utilities/catchAsync.js";
import { deleteOne, getAll, getOne } from "./handlerFactory.js";

export const requestRole = catchAsync(async (req, res, next) => {
  const { roleType } = req.body;

  const attachments = [];
  for (const file of req.files) {
    attachments.push(file.path);
  }

  await roleRequestModel.create({
    roleType,
    attachments,
    user: req.user._id,
  });

  return res.status(200).json({
    status: "success",
    message: "Role request has been sent successfully",
  });
});

export const getAllRequests = catchAsync(async (req, res, next) => {
  getAll(roleRequestModel, { path: "user", select: "fullName profilePicture email" })(
    req,
    res,
    next
  );
});

export const getSpecificRequest = catchAsync(async (req, res, next) => {
  getOne(roleRequestModel, { path: "user", select: "fullName profilePicture email" })(
    req,
    res,
    next
  );
});

export const deleteRequest = catchAsync(async (req, res, next) => {
  deleteOne(roleRequestModel)(req, res, next);
});

export const approveRequest = catchAsync(async (req, res, next) => {
  const roleRequest = await roleRequestModel.findOne({
    _id: req.params.id,
  });

  if (!roleRequest) {
    return next(new AppError("No request found with that ID ", 404));
  }

  if (roleRequest.status != requestStatus.pending) {
    return next(
      new AppError(`Request has already been ${roleRequest.status.toLowerCase()} `, 400)
    );
  }

  roleRequest.status = requestStatus.approved;
  await roleRequest.save();

  await User.updateOne(
    { _id: roleRequest.user },
    { $addToSet: { role: roleRequest.roleType } }
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Request has been approved successfully",
  });
});

export const rejectRequest = catchAsync(async (req, res, next) => {
  const roleRequest = await roleRequestModel.findOne({
    _id: req.params.id,
  });

  if (!roleRequest) {
    return next(new AppError("No request found with that ID ", 404));
  }

  if (roleRequest.status != requestStatus.pending) {
    return next(
      new AppError(`Request has already been ${roleRequest.status.toLowerCase()} `, 400)
    );
  }

  roleRequest.status = requestStatus.rejected;
  await roleRequest.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Request has been rejected successfully",
  });
});

export const getUserRequests = catchAsync(async (req, res, next) => {
  const { _id: userId } = req.user;
  getAll(roleRequestModel, "" , { user: userId })(req, res, next);
});
