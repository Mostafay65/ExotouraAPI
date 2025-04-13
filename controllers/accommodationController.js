import Accommodation from "../models/accommodationModel.js";
import catchAsync from "../utilities/catchAsync.js";
import {
  getAll,
  getOne,
  createOne,
  isOwnerUpdateOne,
  isOnwerDeleteOne,
} from "./handlerFactory.js";

const popOptions = 
{
  path: "owner",
  select: "profileDescription rating status email phoneNumber fullName profilePicture ",
};

export const getAllAccommodations = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.params.id) filter.owner = req.params.id;
  getAll(Accommodation, "", filter)(req, res, next);
});

export const getAccommodationById = getOne(Accommodation, popOptions);

export const createAccommodation = createOne(Accommodation);

export const updateAccommodation = isOwnerUpdateOne(Accommodation);

export const deleteAccommodation = isOnwerDeleteOne(Accommodation);
