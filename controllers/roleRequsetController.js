import roleRequestModel from "../models/roleRequestModel.js";
import catchAsync from "../utilities/catchAsync.js";

export const requestRole = catchAsync(async (req, res, next) => {
  const { roleType } = req.body;

  const attachments = [];
  for (const file of req.files) {
    attachments.push(file.path);
  }

  await roleRequestModel.create({
    roleType,
    attachments,
    user: req.user._id,
  });

  return res.status(200).json({
    status: "success",
    message: "Role request has been sent successfully",
  });
});
