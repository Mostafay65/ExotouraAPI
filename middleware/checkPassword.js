import User from "../models/userModel.js";
import AppError from "../utilities/appError.js";
import catchAsync from "../utilities/catchAsync.js";

const checkPassword = catchAsync(async (req, res, next) => {
  if (!req.body.password) {
    return next(
      new AppError("Password is required. Please provide a valid password.", 400)
    );
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.correctPassword(req.body.password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  next();
});

export default checkPassword;
