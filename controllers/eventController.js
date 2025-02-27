import {
  createOne,
  isOnwerDeleteOne,
  isOwnerUpdateOne,
  getAll,
  getOne,
} from "./handlerFactory.js";
import Event from "../models/eventModel.js";
import catchAsync from "../utilities/catchAsync.js";

export const getAllEvents = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.params.id) filter.owner = req.params.id;
  getAll(Event, "", filter)(req, res, next);
});

const popOptions = {
  path: "owner",
  select: "profileDescription rating status email phoneNumber fullName profilePicture ",
};


export const getEventById = getOne(Event , popOptions);

export const createEvent = createOne(Event);

export const deleteEvent = isOnwerDeleteOne(Event);

export const updateEvent = isOwnerUpdateOne(Event);
