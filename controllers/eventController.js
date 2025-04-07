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

export const getAllEvents = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.params.id) filter.owner = req.params.id;
  getAll(Event, "", filter)(req, res, next);
});

const popOptions = {
  path: "owner",
  select: "profileDescription rating status email phoneNumber fullName profilePicture ",
};

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
    console.log();
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
