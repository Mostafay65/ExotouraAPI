import Joi from "joi";
import mongoose from "mongoose";

const validObjectId = (value, helpers) => {
  return mongoose.Types.ObjectId.isValid(value) ? true : helpers.message("in-Valid id");
};
export const generalFeilds = {
  id: Joi.string().custom(validObjectId),
};
export const attachmentSchema = Joi.object({
  fieldname: Joi.string()
    .valid("attachments", "userPicture", "idCard", "images")
    .required(),
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

export const validate = (schema) => {
  return (req, res, next) => {
    const data = { ...req.params, ...req.query, ...req.body };
    if (req.files) {
      for (const filed in req.files) {
        data[filed] = req.files[filed];
      }
    }
    if (req.file) {
      data.file = req.file;
    }
    // handle locations field if it is a string
    if (typeof data.locations === "string") {
      try {
        data.locations = JSON.parse(data.locations);
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: ["Invalid JSON in locations"] });
      }
    }

    const result = schema.validate(data, { abortEarly: false });
    if (result.error) {
      const messageList = result.error.details.map((obj) => obj.message);

      return res.status(400).json({ success: false, message: messageList });
    }

    return next();
  };
};

export const validateHangout = (schema) => (req, res, next) => {
  const data = { ...req.params, ...req.query, ...req.body };
  if (req.files) {
    data.images = [];
    for (const filed in req.files) {
      data.images.push(req.files[filed]);
    }
  }
  if (req.file) {
    data.file = req.file;
  }
  // handle locations field if it is a string
  if (typeof data.locations === "string") {
    try {
      data.locations = JSON.parse(data.locations);
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: ["Invalid JSON in locations"] });
    }
  }

  const result = schema.validate(data, { abortEarly: false });
  if (result.error) {
    const messageList = result.error.details.map((obj) => obj.message);

    return res.status(400).json({ success: false, message: messageList });
  }
  req.body.images = data.images?.map((file) => file.path) || [];
  req.body.locations = data.locations || [];
  return next();
};
