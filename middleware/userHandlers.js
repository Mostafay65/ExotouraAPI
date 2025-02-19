import AppError from "../utilities/appError.js";
import filterBody from "../utilities/filterBody.js";

export const setUserId = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

export const filterAdminBody = (req, res, next) => {
  req.body = filterBody(
    req.body,
    "email",
    "phoneNumber",
    "fullName",
    "profilePicture",
    "location",
    "languagesSpoken",
    "role",
    "emailStatus"
  );

  next();
};

export const filterUserBody = (req, res, next) => {
  const { password, email } = req.body;
  if (password || email)
    return next(
      new AppError(
        "This route is not for password or email update. Please use /updatepassword to update your password or /updateemail to update your email.",
        400
      )
    );

  req.body = filterBody(
    req.body,
    "phoneNumber",
    "fullName",
    "profilePicture",
    "location",
    "languagesSpoken"
  );
  next();
};
