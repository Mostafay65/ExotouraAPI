import Joi from "joi";
import roles from "../helpers/roles.js";
import { attachmentSchema, generalFeilds } from "../middleware/validation.js";

export const requestRoleSchema = Joi.object().keys({
  roleType: Joi.string()
    .valid(...Object.values(roles))
    .required(),
  attachments: Joi.array().items(attachmentSchema).min(1).max(5).required(),
  userPicture: Joi.array().items(attachmentSchema).min(1).max(1).required(),
  idCard: Joi.array().items(attachmentSchema).min(1).max(1).required(),
});

export const idSchema = Joi.object().keys({
  id: generalFeilds.id.required(),
});

export const lecturerRequestSchema = Joi.object().keys({
  id: generalFeilds.id.required(),
  attachments: Joi.array().items(attachmentSchema).min(1).max(5).required(),
  userPicture: Joi.array().items(attachmentSchema).min(1).max(1).required(),
  idCard: Joi.array().items(attachmentSchema).min(1).max(1).required(),
});
