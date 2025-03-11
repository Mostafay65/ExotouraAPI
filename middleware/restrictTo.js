import AppError from "../utilities/appError.js";

const restrictTo =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user.role.some((role) => allowedRoles.includes(role))) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }

    next();
  };

export default restrictTo;
