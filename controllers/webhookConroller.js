import paymentStatus from "../helpers/paymentStatus.js";
import transactionStatuses from "../helpers/transactionStatus.js";
import transactionTypes from "../helpers/transactionTypes.js";
import Payment from "../models/paymentModel.js";
import Transaction from "../models/transactionModel.js";
import StripePay from "../services/stripeService.js";

export const stripeWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const stripe = new StripePay().stripe;
  const stripeService = new StripePay();

  const webhookSecret =
    process.env.NODE_ENV === "development"
      ? process.env.STRIPE_LOCAL_WEBHOOK_SECRET
      : process.env.STRIPE_LIVE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    const intent = event.data.object;

    switch (event.type) {
      case "payment_intent.amount_capturable_updated": {
        const { activityType, activityId, userId, expectedCaptureDate, isReauthorized } =
          intent.metadata;
        if (isReauthorized) break;

        const transaction = new Transaction({
          user: userId,
          type: transactionTypes.capture,
          amount: intent.amount,
          currency: intent.currency,
        });

        const payment = new Payment({
          paymentIntentId: intent.id,
          user: userId,
          activityType,
          activity: activityId,
          amount: intent.amount,
          currency: intent.currency,
          expectedCaptureDate,
          paymentMethodId: intent.payment_method,
          transactions: [transaction._id],
        });

        await Promise.all([transaction.save(), payment.save()]);

        break;
      }
      case "payment_intent.succeeded": {
        const ownerStripeAccount = intent.metadata.ownerStripeAccount;

        const charge = await stripe.charges.retrieve(intent.latest_charge);
        const balanceTransaction = await stripe.balanceTransactions.retrieve(
          charge.balance_transaction
        );

        const stripeFee = balanceTransaction.fee;
        const paymentAmount = balanceTransaction.amount;

        let platformFee = 0;
        let netAmount = paymentAmount - stripeFee;

        if (ownerStripeAccount) {
          platformFee = stripeService.getApplicationFee(paymentAmount);
          netAmount -= platformFee;
        }

        if (ownerStripeAccount) {
          await stripeService.transferFunds(
            netAmount,
            ownerStripeAccount,
            charge.id,
            intent.id,
            intent.metadata.userId
          );
        }

        const payment = await Payment.findOneAndUpdate(
          { paymentIntentId: intent.id },
          {
            status: paymentStatus.succeeded,
            platformFee: ownerStripeAccount ? platformFee : undefined,
            providerFee: stripeFee,
            netAmount,
            amount: paymentAmount,
            currency: "usd",
          },
          { new: true }
        );

        await Transaction.findOneAndUpdate(
          {
            _id: { $in: payment.transactions },
            type: transactionTypes.capture,
            status: transactionStatuses.pending,
          },
          { status: transactionStatuses.completed }
        );

        break;
      }
      case "payment_intent.canceled": {
        if (intent.cancellation_reason === "duplicate") break;

        const payment = await Payment.findOneAndUpdate(
          { paymentIntentId: intent.id },
          { status: paymentStatus.canceled },
          { new: true }
        );
        await Transaction.findOneAndUpdate(
          {
            _id: { $in: payment.transactions },
            type: transactionTypes.capture,
            status: transactionStatuses.pending,
          },
          {
            status: transactionStatuses.failed,
            reason: intent.cancellation_reason || undefined,
          }
        );
        break;
      }
      case "charge.expired": {
        const payment = await Payment.findOneAndUpdate(
          { paymentIntentId: intent.id },
          { status: paymentStatus.expired },
          { new: true }
        );
        await Transaction.findOneAndUpdate(
          {
            _id: { $in: payment.transactions },
            type: transactionTypes.capture,
            status: transactionStatuses.pending,
          },
          { status: transactionStatuses.failed }
        );
        break;
      }
      case "transfer.created": {
        const transaction = await Transaction.create({
          user: intent.metadata.userId,
          type: transactionTypes.transfer,
          status: transactionStatuses.completed,
          amount: intent.amount,
          currency: intent.currency,
        });

        await Payment.findOneAndUpdate(
          { paymentIntentId: intent.metadata.originalPaymentIntent },
          { $push: { transactions: transaction._id } }
        );
        break;
      }
      case "payout.created": {
        await Transaction.create({
          type: transactionTypes.payout,
          status: transactionStatuses.pending,
          amount: intent.amount,
          currency: intent.currency,
          user: intent.metadata.userId,
        });

        break;
      }
      case "payout.paid": {
        await Transaction.findOneAndUpdate(
          {
            type: transactionTypes.payout,
            status: transactionStatuses.pending,
            user: intent.metadata.userId,
          },
          { status: transactionStatuses.completed }
        );

        break;
      }
      case "payout.failed": {
        await Transaction.findOneAndUpdate(
          {
            type: transactionTypes.payout,
            status: transactionStatuses.pending,
            user: intent.metadata.userId,
          },
          { status: transactionStatuses.failed }
        );

        break;
      }
    }
  } catch (error) {
    console.error(error);
  }
};
