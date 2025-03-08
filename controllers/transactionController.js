import httpStatusText from "../helpers/httpStatusText.js";
import Transaction from "../models/transactionModel.js";
import catchAsync from "../utilities/catchAsync.js";
import { getAll } from "./handlerFactory.js";

export const getAllTransactions = getAll(Transaction);

// TODO: Edit later.
export const getCustomerTransactions = catchAsync(async (req, res, next) => {
  const transactions = await Transaction.find({ user: req.user._id });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    // result: doc.length,
    // total,
    data: {
      transactions,
    },
  });
});
