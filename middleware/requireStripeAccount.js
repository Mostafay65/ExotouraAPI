import AppError from "../utilities/appError.js";

const requireStripeAccount = (req, res, next) => {
  if (!req.user.stripeAccountId) {
    return next(
      new AppError("You must have a connected Stripe account to create an activity.", 403)
    );
  }
  next();
};

export default requireStripeAccount;
