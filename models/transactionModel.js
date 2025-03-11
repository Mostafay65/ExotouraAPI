import mongoose, { Schema } from "mongoose";
import transactionTypes from "../helpers/transactionTypes.js";
import transactionStatuses from "../helpers/transactionStatus.js";

const transactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required."],
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required."],
    },
    currency: {
      type: String,
      required: [true, "Currency is required."],
    },
    type: {
      type: String,
      enum: {
        values: [...Object.values(transactionTypes)],
        message: `Transaction type is either: ${Object.values(transactionTypes).join(
          ", "
        )}.`,
      },
      required: [true, "Transaction type is required."],
    },
    status: {
      type: String,
      enum: {
        values: [...Object.values(transactionStatuses)],
        message: `Transaction Status is either: ${Object.values(transactionStatuses).join(
          ", "
        )}.`,
      },
      default: transactionStatuses.pending,
    },
    reason: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
