import Joi from "joi";
import mongoose from "mongoose";

const validObjectId = (value, helpers) => {
  return mongoose.Types.ObjectId.isValid(value) ? true : helpers.message("in-Valid id");
};
export const generalFeilds = {
  id: Joi.string().custom(validObjectId),
};

export const validate = (schema) => {
  return (req, res, next) => {
    const data = { ...req.params, ...req.query, ...req.body };

    if (req.file || req.files?.length) {
      data.attachments = req.file || req.files;
    }

    const result = schema.validate(data, { abortEarly: false });

    if (result.error) {
      const messageList = result.error.details.map((obj) => obj.message);

      return res.status(400).json({ success: false, message: messageList });
    }

    return next();
  };
};
