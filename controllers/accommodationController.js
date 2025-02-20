import Hoster from "../models/hosterModel.js";
import Accommodation from "../models/accommodationModel.js";
import catchAsync from "../utilities/catchAsync.js";
import {
  getAll,
  getOne,
  createOne,
  deleteOne,
  isOwnerUpdateOne,
  isOnwerDeleteOne,
} from "./handlerFactory.js";
import AppError from "../utilities/appError.js";
import httpStatusText from "../helpers/httpStatusText.js";
import filterBody from "../utilities/filterBody.js";

const popOptions = {
  path: "owner",
  select: "profileDescription rating status email phoneNumber fullName profilePicture ",
};


const getAllAccommodations = getAll(Accommodation);
const getAccommodationById = getOne(Accommodation, popOptions);

const createAccommodation = createOne(Accommodation);

const updateAccommodation = isOwnerUpdateOne(Accommodation);

const deleteAccommodation = isOnwerDeleteOne(Accommodation);

export default {
  getAllAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
};
