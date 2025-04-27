import httpStatusText from "../helpers/httpStatusText.js";
import StripePay from "../services/stripeService.js";
import catchAsync from "../utilities/catchAsync.js";
import activityTypes from "../helpers/activityTypes.js";
import Accommodation from "../models/accommodationModel.js";
import AppError from "../utilities/appError.js";
import User from "../models/userModel.js";
import Payment from "../models/paymentModel.js";
import paymentStatus from "../helpers/paymentStatus.js";
import { getAll } from "./handlerFactory.js";
import roles from "../helpers/roles.js";
import ApiFeatures from "../utilities/apiFeatures.js";

export const createStripeAccount = catchAsync(async (req, res, next) => {
  if (req.user.stripeAccountId) {
    return next(new AppError("User already has a Stripe account.", 400));
  }

  const id = await new StripePay(req.user).createStripeAccount();
  await User.findByIdAndUpdate(req.user._id, { stripeAccountId: id });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Stripe account created successfully.",
  });
});
export const generateKYCLink = catchAsync(async (req, res, next) => {
  const { refreshUrl, returnUrl } = req.body;

  if (!refreshUrl || !returnUrl) {
    return next(new AppError("Please Provide refresh and return url.", 400));
  }

  const account = await new StripePay().stripe.accounts.retrieve(
    req.user.stripeAccountId
  );
  if (account.details_submitted && account.payouts_enabled) {
    return next(
      new AppError("User has already passed KYC verification and is complete.", 400)
    );
  }

  const url = await new StripePay(req.user).generateAccountLink(refreshUrl, returnUrl);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    url,
  });
});

export const createPaymentIntent = catchAsync(async (req, res, next) => {
  const { id, activityType, paymentMethodId, expectedCaptureDate } = req.body;

  if (!id || !activityType || !expectedCaptureDate) {
    return next(
      new AppError("Please provide activity type, expected capture date, and id.", 400)
    );
  }
  if (expectedCaptureDate < new Date())
    next(new AppError("Expected capture date must be in the future.", 400));

  if (!req.user.stripeCustomerId) {
    const customer = await new StripePay(req.user).createStripeCustomer();
    const currentUser = await User.findByIdAndUpdate(
      req.user._id,
      { stripeCustomerId: customer.id },
      { new: true }
    );
    req.user = currentUser;
  }

  const normalizedType = activityType.toLowerCase();

  const modelMap = {
    accommodation: Accommodation,
    // event: Event,
    // tour: Tour,
    // donation: Donation,
  };
  if (!modelMap[normalizedType]) {
    return next(new AppError("Invalid Activity type.", 400));
  }

  const activity = await modelMap[normalizedType].findById(id).populate("owner");
  if (!activity) {
    return next(new AppError(`No ${normalizedType} found with that ID.`, 404));
  }
  if (activity.owner._id.equals(req.user._id)) {
    return next(new AppError("You cannot purchase an activity that you created.", 400));
  }

  const { clientSecret, paymentIntentId } = await new StripePay(
    req.user
  ).authorizePayment({
    amount: activity.price,
    activityType: activityTypes[normalizedType],
    activityId: activity._id,
    ownerStripeAccount: activity.owner.stripeAccountId,
    paymentMethodId,
    expectedCaptureDate,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    clientSecret,
    paymentIntentId,
  });
});
export const cancelPayment = catchAsync(async (req, res, next) => {
  const { paymentIntentId } = req.body;
  const stripeService = new StripePay(req.user);

  const payment = await Payment.findOne({
    paymentIntentId,
    status: paymentStatus.uncaptured,
  });
  if (!payment) {
    return next(new AppError("No payment found with that payment intent ID.", 404));
  }
  if (!payment.user.equals(req.user._id)) {
    return next(new AppError("You are not authorized to access this payment.", 403));
  }

  await stripeService.cancelPayment(req.body.paymentIntentId);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Payment has been canceled successfully.",
  });
});
export const reauthorizePayments = async () => {
  const oneDayLater = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const expiringPayments = await Payment.find({
    expiresAt: { $lte: oneDayLater },
    status: paymentStatus.uncaptured,
  })
    .populate({ path: "user", select: "_id email stripeCustomerId" })
    .populate({
      path: "activity",
      populate: { path: "owner", select: "stripeAccountId" },
    });
  if (!expiringPayments.length) return;

  const bulkOperations = [];
  for (const payment of expiringPayments) {
    if (new Date() >= payment.expectedCaptureDate) continue;

    let id;
    try {
      id = await new StripePay().reauthorizePayment(payment);
    } catch (error) {
      console.error("Failed to reauthorize payment ${payment._id}: ", error.message);
    }

    if (id) {
      bulkOperations.push({
        updateOne: {
          filter: { _id: payment._id },
          update: { paymentIntentId: id, expiresAt: fiveDaysLater },
        },
      });
    } else {
      bulkOperations.push({
        updateOne: {
          filter: { _id: payment._id },
          update: { status: paymentStatus.reauthorizationFailed },
        },
      });
      // TODO: notify user of payment fail and to update the payment method manually.
    }
  }
  await Payment.bulkWrite(bulkOperations);
};
export const capturePayment = catchAsync(async (req, res, next) => {
  const stripeService = new StripePay();
  await stripeService.capturePayment(req.body.paymentIntentId);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Payment has been captured successfully.",
  });
});
export const withdrawFunds = catchAsync(async (req, res, next) => {
  const stripeService = new StripePay(req.user);
  await stripeService.payoutFunds();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Funds withdrawal request has been successfully processed.",
  });
});

export const getAllPayments = getAll(Payment);
export const getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id).populate("transactions");

  if (!payment) {
    return next(new AppError("No payment found with that ID.", 404));
  }
  if (!payment.user.equals(req.user._id) && req.user.role !== roles.admin) {
    return next(new AppError("You are not authorized to access this payment.", 403));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      payment,
    },
  });
});

export const getPlatformRevenue = catchAsync(async (req, res, next) => {
  const stripe = new StripePay(req.user).stripe;

  const revenue = await stripe.balance.retrieve();
  const available = revenue.available[0];
  const connectReserved = revenue.connect_reserved[0];
  const pending = revenue.pending[0];

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      revenue: { available, connectReserved, pending },
    },
  });
});
export const getAccountRevenue = catchAsync(async (req, res, next) => {
  const stripe = new StripePay(req.user).stripe;

  const revenue = await stripe.balance.retrieve({
    stripeAccount: req.user.stripeAccountId,
  });
  const available = revenue.available[0];
  const pending = revenue.pending[0];
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      revenue: {
        available,
        pending,
      },
    },
  });
});

// TODO: Edit later.
export const getCustomerPayments = catchAsync(async (req, res, next) => {
  const filter = {
    user: req.user._id,
  };
  getAll(Payment, "transactions", filter)(req, res, next);
});
// export const getCustomerPayments = catchAsync(async (req, res, next) => {
//   const features = new ApiFeatures(Payment.find({ user: req.user._id }), req.query)
//     .limitFields()
//     .paginate();
//   const payments = await features.query.populate("transactions")

//   res.status(200).json({
//     status: httpStatusText.SUCCESS,
//     result: doc.length,
//     total,
//     data: {
//       payments,
//     },
//   });
// });
export const getAccountPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find().populate({
    path: "activity",
    match: { owner: req.user._id },
    select: "_id",
  });
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    // result: doc.length,
    // total,
    data: {
      payments,
    },
  });
});
