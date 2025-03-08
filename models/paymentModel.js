import mongoose, { Schema } from "mongoose";
import paymentStatus from "../helpers/paymentStatus.js";
import activityTypes from "../helpers/activityTypes.js";

const paymentSchema = new Schema(
  {
    paymentIntentId: {
      type: String,
      required: [true, "Payment intent id is required."],
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required."],
    },
    activityType: {
      type: String,
      enum: {
        values: [...Object.values(activityTypes)],
        message: `Acivity type is either: ${Object.values(activityTypes).join(", ")}.`,
      },
      required: [true, "Activity type is required."],
    },
    activity: {
      type: Schema.Types.ObjectId,
      refPath: "activityType",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required."],
    },
    platformFee: Number,
    providerFee: Number,
    netAmount: Number,
    currency: {
      type: String,
      default: "egp",
    },
    status: {
      type: String,
      enum: {
        values: [...Object.values(paymentStatus)],
        message: `Status is either: ${Object.values(paymentStatus).join(", ")}.`,
      },
      default: paymentStatus.uncaptured,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["card"],
        message: `Payment method can be card only.`,
      },
      default: "card",
    },
    paymentMethodId: {
      type: String,
      required: [true, "Payment method id is required."],
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    expectedCaptureDate: {
      type: Date,
      required: [true, "Expicted capture date is required."],
    },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
