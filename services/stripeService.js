import Stripe from "stripe";

class StripePay {
  constructor(user, currency = "egp") {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.currency = currency;
    this.user = user;
  }

  getApplicationFee(amount) {
    return Math.min(Math.round(amount * 0.05), 1000);
  }

  // create payment intent.
  async authorizePayment({
    amount,
    activityType,
    activityId,
    ownerStripeAccount,
    paymentMethodId,
    autoCapture = false,
    expectedCaptureDate,
  }) {
    const captureMethod = autoCapture ? "automatic_async" : "manual";

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency: this.currency,
      payment_method_types: ["card"],
      capture_method: captureMethod,
      payment_method: paymentMethodId,
      confirm: !!paymentMethodId,
      receipt_email: this.user.email,
      customer: this.user.stripeCustomerId,
      metadata: {
        userId: String(this.user._id),
        activityType,
        activityId: String(activityId),
        ownerStripeAccount,
        expectedCaptureDate,
      },
      setup_future_usage: "off_session",
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  // transfer funds to connected accounts.
  transferFunds(amount, destination, chargeId, paymentIntentId, userId) {
    return this.stripe.transfers.create({
      amount,
      currency: "usd",
      destination,
      source_transaction: chargeId,
      metadata: {
        originalPaymentIntent: paymentIntentId,
        userId,
      },
    });
  }

  // capture payment after adding payment details.
  capturePayment(paymentIntentId) {
    return this.stripe.paymentIntents.capture(paymentIntentId);
  }

  // cancel payment before succeeded (incomplete - captured).
  cancelPayment(paymentIntentId) {
    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  // create a stripe account to receive funds.
  async createStripeAccount() {
    const {
      fullName: { firstName, lastName },
      email,
    } = this.user;

    const { id } = await this.stripe.accounts.create({
      type: "custom",
      email: this.user.email,
      country: "eg",
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      tos_acceptance: {
        service_agreement: "recipient",
      },
      settings: {
        payouts: {
          schedule: {
            interval: "manual",
          },
        },
      },
      individual: {
        first_name: firstName,
        last_name: lastName,
        email,
      },
    });

    return id;
  }

  // create stripe customer for the paying user.
  createStripeCustomer() {
    const {
      email,
      fullName: { firstName, lastName },
    } = this.user;
    return this.stripe.customers.create({ email, name: `${firstName} ${lastName}` });
  }

  // generate KYC verification link to activaite your stripe account.
  async generateAccountLink(refreshUrl, returnUrl) {
    const { url } = await this.stripe.accountLinks.create({
      account: this.user.stripeAccountId,
      type: "account_onboarding",
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });

    return url;
  }

  // payout (withdraw) funds to a bank account or else.
  async payoutFunds(destination) {
    const stripeAccount = this.user.stripeAccountId;
    const availableBalance = (await this.stripe.balance.retrieve({ stripeAccount }))
      .available[0];

    return this.stripe.payouts.create(
      {
        amount: availableBalance.amount,
        currency: availableBalance.currency,
        ...(destination ? { destination } : {}),
        metadata: { userId: String(this.user._id) },
      },
      { stripeAccount }
    );
  }

  // reauthorize uncaptured payments.
  async reauthorizePayment({
    amount,
    paymentMethodId,
    paymentIntentId,
    user: { email, stripeCustomerId, _id },
    activity: {
      owner: { stripeAccountId },
    },
  }) {
    await this.stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: "duplicate",
    });
    const { id } = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: this.currency,
      payment_method_types: ["card"],
      capture_method: "manual",
      payment_method: paymentMethodId,
      confirm: true,
      receipt_email: email,
      customer: stripeCustomerId,
      metadata: {
        isReauthorized: "true",
        ownerStripeAccount: stripeAccountId,
        userId: String(_id),
      },
    });

    return id;
  }
}

export default StripePay;
