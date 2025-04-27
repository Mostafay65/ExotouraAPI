import { getAll, getOne, createOne, updateOne, deleteOne } from "./handlerFactory.js";
import VolunteerRequest from "../models/volunteerRequestModel.js";
import catchAsync from "../utilities/catchAsync.js";
import AppError from "../utilities/appError.js";
import httpStatusText from "../helpers/httpStatusText.js";
import volunteerStatus from "../helpers/volunteerStatus.js";
import filterBody from "../utilities/filterBody.js";
// Get all volunteer requests with user and volunteer populated
export const getAllVolunteerRequests = getAll(
  VolunteerRequest,
  [
    { path: "user", select: "fullName email profilePicture" },
    { path: "volunteer", select: "fullName email profilePicture" },
  ],
  { status: volunteerStatus.pending }
);

// Get single volunteer request
export const getVolunteerRequest = getOne(VolunteerRequest, [
  { path: "user", select: "fullName email profilePicture" },
  { path: "volunteer", select: "fullName email profilePicture" },
]);

// Create volunteer request
export const createVolunteerRequest = catchAsync(async (req, res, next) => {
  // Set the user to the current logged in user
  req.body.user = req.user._id;
  if (req.body.volunteer) {
    req.body.status = volunteerStatus.accepted;
  }

  // volunteer ==> optinal
  // message
  const volunteerRequest = await VolunteerRequest.create(req.body);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Volunteer request has been created successfully!",
    data: {
      volunteerRequest,
    },
  });
});

// Update volunteer request status
export const updateVolunteerRequestStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  req.body = filterBody(req.body, "status", "feedback");
  if (req.files) {
    req.body.images = [];
    req.files.forEach((file) => {
      req.body.images.push(file.filename);
    });
  }
  const volunteerRequest = await VolunteerRequest.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "user", select: "fullName email profilePicture" },
    { path: "volunteer", select: "fullName email profilePicture" },
  ]);

  if (!volunteerRequest) {
    return next(new AppError("No volunteer request found with that ID", 404));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Volunteer request status has been updated successfully!",
    data: {
      volunteerRequest,
    },
  });
});

// Assign volunteer to request
export const assignVolunteer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const volunteerId = req.user._id;

  const volunteerRequest = await VolunteerRequest.findOneAndUpdate(
    {
      _id: id,
      status: volunteerStatus.accepted,
      volunteer: { $exists: false },
    },
    {
      volunteer: volunteerId,
      status: volunteerStatus.accepted,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate([
    { path: "user", select: "fullName email profilePicture" },
    { path: "volunteer", select: "fullName email profilePicture" },
  ]);

  if (!volunteerRequest) {
    return next(
      new AppError("Volunteer request not found or already assigned to a volunteer", 400)
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Volunteer has been assigned successfully!",
    data: {
      volunteerRequest,
    },
  });
});

// Get my volunteer requests (as a user)
export const getMyRequests = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const volunteerRequests = await VolunteerRequest.find({ user: userId }).populate([
    { path: "user", select: "fullName email profilePicture" },
    { path: "volunteer", select: "fullName email profilePicture" },
  ]);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: volunteerRequests.length,
    data: {
      volunteerRequests,
    },
  });
});

// Get my assigned requests (as a volunteer)
export const getMyAssignedRequests = catchAsync(async (req, res, next) => {
  const filter = { volunteer: req.user._id };
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const volunteerRequests = await VolunteerRequest.find(filter).populate([
    { path: "user", select: "fullName email profilePicture" },
    { path: "volunteer", select: "fullName email profilePicture" },
  ]);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: volunteerRequests.length,
    data: {
      volunteerRequests,
    },
  });
});
