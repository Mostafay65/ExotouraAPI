import User from "../models/userModel.js";
import AppError from "../utilities/appError.js";
import catchAsync from "../utilities/catchAsync.js";
import sendTokenResponse, { signToken } from "../utilities/sendTokenResponse.js";
import filterBody from "../utilities/filterBody.js";
import crypto from "crypto";
import Email from "../services/emailService.js";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import mongoose from "mongoose";
import httpStatusText from "../helpers/httpStatusText.js";
import googleService from "../services/googleService.js";

export const signup = catchAsync(async (req, res, next) => {
  // Start a session and transaction.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const filteredBody = filterBody(
      req.body,
      "email",
      "phoneNumber",
      "fullName",
      "profilePicture",
      "location",
      "password"
    );

    const user = await User.create([filteredBody], { session });

    const verificationCode = user[0].createVerificationCode();
    await user[0].save({ validateBeforeSave: false });

    try {
      await new Email(user[0], verificationCode).sendVerify();
    } catch {
      return next(new AppError("Email sending failed. Please try again later.", 500));
    }

    // Commit transaction.
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: "User signed up! Verification email sent.",
    });
  } catch (err) {
    // Abort transaction
    await session.abortTransaction();
    session.endSession();

    return next(err);
  }
});

export const googleTokenAuth = catchAsync(async (req, res, next) => {
  const { googleAccessToken } = req.body;
  if (!googleAccessToken) {
    return next(new AppError("Please provide Google access token", 400));
  }
  const googleUser = await googleService.getUserInfo(googleAccessToken);
  if (!googleUser) {
    return next(new AppError("Google user not found", 404));
  }
  // Find or create user
  let user = await User.findOne({ email: googleUser.email });

  if (!user) {
    user = await User.create({
      email: googleUser.email,
      fullName: {
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
      },
      profilePicture: googleUser.picture,
      emailStatus: googleUser.email_verified ? "verified" : "awaitingVerification",
      password: crypto.randomBytes(32).toString("hex"), // Random secure password
    });
  }

  sendTokenResponse(user, 200, res, "Google authentication successful");
});

export const resendVerificationCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select("+tempEmail");

  if (!user) {
    return next(new AppError("User with this email address is not found.", 404));
  }

  const isEmailChange = Boolean(user.tempEmail);

  if (!isEmailChange && user.emailStatus !== "awaitingVerification")
    return next(new AppError("Email is already verified.", 400));

  const verificationCode = user.createVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    if (isEmailChange) {
      await new Email(user, verificationCode, user.tempEmail).sendVerify();
    } else {
      await new Email(user, verificationCode).sendVerify();
    }

    res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: "Verification code sent to email.",
    });
  } catch {
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("Email sending failed. Please try again later.", 500));
  }
});

export const verifyEmail = catchAsync(async (req, res, next) => {
  const hashedCode = crypto.createHash("sha256").update(req.params.code).digest("hex");

  const user = await User.findOne({
    verificationCode: hashedCode,
    verificationCodeExpires: { $gt: Date.now() },
  }).select("+tempEmail");

  if (!user) {
    return next(new AppError("Verification code is invalid.", 400));
  }

  const isEmailChange = Boolean(user.tempEmail);
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  if (isEmailChange) {
    user.email = user.tempEmail;
    user.tempEmail = undefined;
  } else {
    user.emailStatus = "verified";
  }
  await user.save({ validateBeforeSave: false });

  const message = isEmailChange
    ? "Email updated successfully."
    : "Email verified successfully.";

  sendTokenResponse(user, 200, res, message);
});

export const signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  if (user.emailStatus === "awaitingVerification") {
    return next(
      new AppError(
        "Your email is not verified. Please check your email for the verification link.",
        403
      )
    );
  }

  sendTokenResponse(user, 200, res);
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { jwt: refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(
      new AppError("Session expired or invalid. Please log in to continue.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decoded.id);

  const accessToken = signToken(
    {
      userInfo: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    process.env.ACCESS_TOKEN_EXPIRES_IN
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    accessToken,
  });
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.correctPassword(req.body.currentPassword))) {
    return next(new AppError("Password is incorrect.", 401));
  }

  user.password = req.body.password;
  await user.save();

  await new Email(user).sendNotifyPasswordChange();

  sendTokenResponse(user, 200, res);
});

export const updateEmail = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email: req.user.email }).select("+password");

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  user.tempEmail = email;
  const validationError = user.validateSync(["tempEmail"]);
  if (validationError) {
    return next(new AppError(validationError.errors.tempEmail.message, 400));
  }

  const verificationCode = user.createVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    await new Email(user, verificationCode, email).sendVerify();

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Verification code sent to the new email.",
    });
  } catch (err) {
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.tempEmail = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("Failed to send verification email. Try again later.", 500));
  }
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address.", 404));
  }

  const resetCode = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await new Email(user, resetCode).sendPasswordReset();

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Code has been sent to your email.",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There is an error sending the email. Try again later.", 500)
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.code).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired.", 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

export const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Already logged out",
    });
  }
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "None",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(204).send(null);
};
