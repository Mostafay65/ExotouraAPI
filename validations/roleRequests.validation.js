import Joi from "joi";
import roles from "../helpers/roles.js";

export const attachmentSchema = Joi.object({
  fieldname: Joi.string().valid("attachments").required(),
  originalname: Joi.string().required(),
  encoding: Joi.string().required(),
  mimetype: Joi.string()
    .valid("image/jpeg", "image/png", "image/heic", "image/webp")
    .required(),
  filename: Joi.string().required(),
  path: Joi.string().required(),
  size: Joi.number()
    .max(5 * 1024 * 1024)
    .required(),
});

export const requestRoleSchema = Joi.object()
  .keys({
    roleType: Joi.string().valid(roles.hoster , roles.organizer).required(),  
    attachments: Joi.array().items(attachmentSchema).min(2).max(10),
  })
  