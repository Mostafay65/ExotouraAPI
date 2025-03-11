import AppError from "../utilities/appError.js";
import filterBody from "../utilities/filterBody.js";
import Disability from "../models/DisabilityModel.js";
import catchAsync from "../utilities/catchAsync.js";

const handelUserbody = catchAsync(async (req, res, next) => {
  if (req.file) {
    req.body.profilePicture = req.file.path;
  }

  if (req.body.location) {
    req.body.location = {
      coordinates: req.body.location.split(",").map((coord) => Number(coord.trim())),
    };
  }

  if (req.body.languagesSpoken) {
    req.body.languagesSpoken = req.body.languagesSpoken.split(",");
  }

  if (req.body.firstName) {
    if (!req.body.lastName) {
      return next(new AppError("Please provide your last name.", 400));
    } else {
      req.body.fullName = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      };
    }
  }

  if (req.body.disabilities) {
    req.body.disabilities = req.body.disabilities.split(",");
    for (const disability of req.body.disabilities) {
      const disabilityExists = await Disability.findById(disability);
      if (!disabilityExists) {
        return next(new AppError(`No disability found with id: ${disability}`, 400));
      }
    }
  }
});

export const setUserId = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

export const filterAdminBody = (req, res, next) => {
  handelUserbody(req, res, next);
  req.body = filterBody(
    req.body,
    "email",
    "phoneNumber",
    "fullName",
    "bio",
    "profilePicture",
    "location",
    "languagesSpoken",
    "role",
    "emailStatus",
    "disabilities"
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

  handelUserbody(req, res, next);

  req.body = filterBody(
    req.body,
    "phoneNumber",
    "fullName",
    "bio",
    "profilePicture",
    "location",
    "languagesSpoken",
    "disabilities"
  );
  next();
};
