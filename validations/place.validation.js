import Joi from "joi";
import { attachmentSchema } from "../middleware/validation.js";
import { placeTypes } from "../models/placeModel.js";

export const createPlaceSchema = Joi.object({
  locationName: Joi.string().required(),
  description: Joi.string().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  rating: Joi.number().default(0).min(0).max(5),
  reviewCount: Joi.number().default(0).min(0),
  images: Joi.array().items(attachmentSchema).min(1).max(15).required(),
  type: Joi.string()
    .valid(...placeTypes)
    .required(),
});
