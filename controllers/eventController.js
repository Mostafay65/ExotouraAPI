import {
  createOne,
  isOwnerOrAdminDeleteOne,
  isOwnerUpdateOne,
  getAll,
  getOne,
} from "./handlerFactory.js";
import Event from "../models/eventModel.js";
import catchAsync from "../utilities/catchAsync.js";
import AppError from "../utilities/appError.js";
import lecturerRequestModel from "../models/lecturerRequestModel.js";
import requestStatus from "../helpers/requestStatus.js";

const popOptions = [
  {
    path: "owner",
    select: "profileDescription rating status email phoneNumber fullName profilePicture ",
  },
  {
    path: "attendees",
    select: "fullName profilePicture ",
  },
  {
    path: "volunteers",
    select: "fullName profilePicture ",
  },
  {
    path: "lecturers",
    select: "     fullName profilePicture ",
  },
];

export const getAllEvents = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.params.id) filter.owner = req.params.id;
  getAll(Event, popOptions, filter)(req, res, next);
});

export const getEventById = getOne(Event, popOptions);

export const createEvent = createOne(Event);

export const deleteEvent = isOwnerOrAdminDeleteOne(Event);

export const updateEvent = isOwnerUpdateOne(Event);

export const registerEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const event = await Event.findById(id);
  if (!event) {
    return next(new AppError(`No event found with that ID.`, 404));
  }

  if (event.registrationEndDate < Date.now()) {
    return next(new AppError(`Registration for this event has been closed.`, 404));
  }

  if (event.status === "Full") {
    return next(new AppError(`This event is full.`, 404));
  }

  if (event.attendees.includes(userId)) {
    return next(new AppError(`You have already registered for this event.`, 400));
  }

  await Event.findByIdAndUpdate(id, {
    $push: { attendees: userId },
  });

  res.status(200).json({
    status: "success",
    message: "You have successfully registered for this event.",
  });
});

export const cancelRegistration = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const event = await Event.findById(id);
  if (!event) {
    return next(new AppError(`No event found with that ID.`, 404));
  }

  if (!event.attendees.includes(userId)) {
    return next(new AppError(`You have not registered for this event.`, 400));
  }

  await Event.findByIdAndUpdate(id, {
    $pull: { attendees: userId },
  });

  res.status(200).json({
    status: "success",
    message: "You have successfully cancelled your registration for this event.",
  });
});

export const checkEventRegistration = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const event = await Event.findById(id);
  if (!event) {
    return next(new AppError(`No event found with that ID.`, 404));
  }

  if (event.attendees.includes(userId)) {
    res.status(200).json({
      status: "success",
      message: "Registered",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Not Registered",
  });
});

export const getUserEvents = catchAsync(async (req, res, next) => {
  const { _id: userId } = req.user;
  getAll(Event, "", { attendees: { $in: [userId] } })(req, res, next);
});

export const getOrganizerEvents = catchAsync(async (req, res, next) => {
  const { _id: userId } = req.user;
  getAll(Event, "", { owner: userId })(req, res, next);
});

export const eventVolunteer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const event = await Event.findById(id);
  if (!event) {
    return next(new AppError(`No event found with that ID.`, 404));
  }
  if (event.volunteers.includes(userId)) {
    return next(new AppError(`You have already volunteered for this event.`, 400));
  }

  await Event.findByIdAndUpdate(id, {
    $push: { volunteers: userId },
  });

  res.status(200).json({
    status: "success",
    message: "You have successfully volunteered for this event.",
  });
});

export const searchEvents = catchAsync(async (req, res, next) => {
  const { search = "", from = "", to = "", type = "" } = req.query;

  const filter = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ],
  };

  if (from) {
    filter["availability.from"] = { $gte: new Date(from) };
  }
  if (to) {
    filter["availability.to"] = { $lte: new Date(to) };
  }

  if (type) {
    filter.type = { $regex: type, $options: "i" };
  }

  const events = await Event.find(filter).populate(popOptions);
  res.status(200).json({
    status: "success",
    results: events.length,
    data: { events },
  });
});

// register or be an lecturers

export const registerLecturer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const event = await Event.findById(id);
  if (!event) {
    return next(new AppError(`No event found with that ID.`, 404));
  }
  if (event.lecturers.includes(userId)) {
    return next(
      new AppError(`You have already registered as a lecturer for this event.`, 400)
    );
  }

  const data = {};

  for (const field in req.files) {
    if (field === "attachments") {
      data[field] = req.files[field].map((file) => file.path);
    } else {
      data[field] = req.files[field][0].path;
    }
  }

  await lecturerRequestModel.create({
    ...data,
    user: userId,
    event: id,
  });

  res.status(200).json({
    status: "success",
    message: "You have successfully registered as a lecturer for this event.",
  });
});

// get all lecturer requests for an event
export const getAllEventLecturerRequests = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const event = await Event.findById(id);
  if (!event) {
    return next(new AppError(`No event found with that ID.`, 404));
  }
  if (event.owner.toString() !== userId.toString()) {
    return next(
      new AppError(`You are not authorized to view this event's requests.`, 403)
    );
  }

  const requests = await lecturerRequestModel
    .find({
      event: id,
      status: requestStatus.pending,
    })
    .populate({
      path: "user",
      select: "fullName email profilePicture",
    });

  res.status(200).json({
    status: "success",
    results: requests.length,
    data: { requests },
  });
});

// accept or reject lecturer request
export const acceptOrRejectLecturerRequest = catchAsync(async (req, res, next) => {
  const { requestId } = req.params;
  const { _id: userId } = req.user;
  const { action } = req.query;

  if (!action) {
    return next(new AppError(`Please provide an action.`, 400));
  }

  const request = await lecturerRequestModel.findById(requestId);
  if (!request) {
    return next(new AppError(`No request found with that ID.`, 404));
  }

  const event = await Event.findById(request.event);
  if (!event) {
    return next(new AppError(`No event found with that ID.`, 404));
  }

  if (event.owner.toString() !== userId.toString()) {
    return next(new AppError(`You are not authorized to accept this request.`, 403));
  }

  if (request.status !== requestStatus.pending) {
    return next(new AppError(`This request has already been processed.`, 400));
  }

  if (action === "reject") {
    request.status = requestStatus.rejected;
    await request.save();
    return res.status(200).json({
      status: "success",
      message: "You have successfully rejected this request.",
    });
  }

  if (action === "accept") {
    request.status = requestStatus.approved;
    await request.save();

    await Event.findByIdAndUpdate(request.event, {
      // Use the event ID from the request
      $push: { lecturers: request.user },
    });

    return res.status(200).json({
      status: "success",
      message: "You have successfully accepted this request.",
    });
  } else {
    return next(new AppError(`Invalid action.`, 400));
  }
});

export const getEventStatistics = catchAsync(async (req, res, next) => {
  const stats = await Event.aggregate([
    {
      $addFields: {
        totalAttendeeRevenue: { $multiply: [{ $size: "$attendees" }, "$price"] },
        accessibilityFeatureCount: { $size: "$accessibilityFeatures" },
      },
    },
    {
      $group: {
        _id: "$type",
        totalEvents: { $sum: 1 },
        totalAttendees: { $sum: { $size: "$attendees" } },
        totalVolunteers: { $sum: { $size: "$volunteers" } },
        avgCa: { $avg: "$maxCapacity" },
        avgPrice: { $avg: "$price" },
        totalRevenueEstimate: { $sum: "$totalAttendeeRevenue" },
        totalAccessibilityFeatures: { $sum: "$accessibilityFeatureCount" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: stats.map((item) => ({
      type: item._id,
      totalEvents: item.totalEvents,
      totalAttendees: item.totalAttendees,
      totalVolunteers: item.totalVolunteers,
      eventsWithDisabilitySupport: item.eventsWithDisabilitySupport,
      averageCapacity: Math.round(item.avgCapacity),
      averagePrice: Math.round(item.avgPrice),
      totalRevenueEstimate: Math.round(item.totalRevenueEstimate),
      totalAccessibilityFeatures: item.totalAccessibilityFeatures,
    })),
  });
});
