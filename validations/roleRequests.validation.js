import Joi from "joi";
import roles from "../helpers/roles.js";
import { generalFeilds } from "../middleware/validation.js";

export const attachmentSchema = Joi.object({
  fieldname: Joi.string().valid("attachments", "userPicture", "idCard").required(),
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

export const requestRoleSchema = Joi.object().keys({
  roleType: Joi.string().valid(roles.hoster, roles.organizer).required(),
  attachments: Joi.array().items(attachmentSchema).min(1).max(5).required(),
  userPicture: Joi.array().items(attachmentSchema).min(1).max(1).required(),
  idCard: Joi.array().items(attachmentSchema).min(1).max(1).required(),
});

export const idSchema = Joi.object().keys({
  id: generalFeilds.id.required(),
});
