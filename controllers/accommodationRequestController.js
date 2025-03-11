import requestStatus from "../helpers/requestStatus.js";
import AccommodationRequest from "../models/accommodationRequestModel.js";
import Accommodation from "../models/accommodationModel.js";
import catchAsync from "../utilities/catchAsync.js";
import AppError from "../utilities/appError.js";
import {
  createOne,
  getAll,
  getOne,
  isOnwerDeleteOne,
  isOwnerUpdateOne,
} from "./handlerFactory.js";
import httpStatusText from "../helpers/httpStatusText.js";

export const getAllUserAccommodationRequests = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.query;
  const filter = { user: id };
  if (status) filter.status = status;
  getAll(AccommodationRequest, "user accommodation", filter)(req, res, next);
});

export const getAllAccommodationRequests = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.query;
  const filter = { accommodation: id };
  if (status) filter.status = status;
  //filter owner
  // const accommodation = await Accommodation.findById(id);
  // if (!accommodation)
  //   return next(new AppError("No accommodation found with that ID", 404));
  // if (accommodation.owner.toString() !== req.user._id.toString())
  //   return next(new AppError("You are not the owner of this accommodation", 401));
  getAll(AccommodationRequest, "user accommodation", filter)(req, res, next);
});

export const getAccommodationRequest = getOne(AccommodationRequest, "user accommodation");

export const createAccommodationRequest = catchAsync(async (req, res, next) => {
  const { accommodation } = req.body;
  const user = (req.body.user = req.user._id);

  const existingAccommodation = await Accommodation.findById(accommodation);
  if (!existingAccommodation) {
    return next(new AppError("No accommodation found with that ID", 404));
  }
  // check that the user is not the hoster
  if (existingAccommodation.owner.toString() === user.toString()) {
    return next(new AppError("You can't send a request to your own accommodation", 400));
  }

  const existingRequest = await AccommodationRequest.findOne({
    accommodation,
    user,
  });

  if (existingRequest) {
    return next(
      new AppError("You have already sent a request for this accommodation", 400)
    );
  }
  req.body.status = requestStatus.pending;
  createOne(AccommodationRequest)(req, res, next);
});

export const updateAccommodationRequest = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const { id } = req.params;
  const accRequest = await AccommodationRequest.findById(id).populate("accommodation");
  if (!accRequest) {
    return next(new AppError("No request found with that ID", 404));
  }
  // check that the user is the hoster or the user that made the request
  if (
    accRequest.user.toString() !== req.user._id.toString() &&
    accRequest.accommodation.owner.toString() !== req.user._id.toString()
  ) {
    return next(new AppError("You are not authorized to update this request", 401));
  }
  if (
    accRequest.status === requestStatus.approved ||
    accRequest.status === requestStatus.rejected
  ) {
    return next(new AppError("You can't update an approved or rejected request", 400));
  }
  accRequest.status = status;
  accRequest.save();
  return res.status(200).json({
    status: "success",
    data: {
      request: accRequest,
    },
  });
});

export const deleteAccommodationRequest = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const accommodationRequest = await AccommodationRequest.findOneAndDelete({
    _id: id,
    user: req.user._id,
    status: requestStatus.pending,
  });
  if (!accommodationRequest) {
    return next(
      new AppError(
        "No request found with that ID or You are not authorized to delete this request",
        404
      )
    );
  }
  return res.status(410).json({
    status: httpStatusText.SUCCESS,
    data: null,
  });
});
