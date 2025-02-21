import Accommodation from "../models/accommodationModel.js";
import {
  getAll,
  getOne,
  createOne,
  isOwnerUpdateOne,
  isOnwerDeleteOne,
} from "./handlerFactory.js";

const popOptions = {
  path: "owner",
  select: "profileDescription rating status email phoneNumber fullName profilePicture ",
};

export const getAllAccommodations = getAll(Accommodation);

export const getAccommodationById = getOne(Accommodation, popOptions);

export const createAccommodation = createOne(Accommodation);

export const updateAccommodation = isOwnerUpdateOne(Accommodation);

export const deleteAccommodation = isOnwerDeleteOne(Accommodation);
