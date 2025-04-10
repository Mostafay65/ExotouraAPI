import Joi from "joi";
import { attachmentSchema, generalFeilds } from "../middleware/validation.js";
import hangoutTypes from "../helpers/hangoutTypes.js";

// Updated createHangoutSchema
export const createHangoutSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required().max(5000),
  date: Joi.date().required(),
  locations: Joi.array()
    .items(
      Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required(),
        placeName: Joi.string().required(),
      })
    )
    .required(),
  images: Joi.array().items(attachmentSchema).min(1).max(15).required(),
  participants: Joi.array().items(Joi.string()),
  type: Joi.string()
    .valid(...hangoutTypes)
    .required(),
});
// get hangout by id schema
export const getHangoutSchema = Joi.object({
  id: generalFeilds.id.required(),
});

export const deleteHangoutSchema = getHangoutSchema;
