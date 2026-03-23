import Stripe from "stripe";

let stripeClient: Stripe | null = null;

const getStripe = () => {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Configure Stripe test key in environment.",
    );
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil",
  });

  return stripeClient;
};

const toMinorUnits = (amount: number) => {
  return Math.round(amount * 100);
};

export const createConnectedTestAccount = async (
  email: string,
  country = "US",
) => {
  const stripe = getStripe();
  return stripe.accounts.create({
    type: "express",
    email,
    country,
    capabilities: {
      transfers: { requested: true },
    },
  });
};

export const createStripeTransfer = async (params: {
  amount: number;
  currency?: string;
  destinationAccountId: string;
  description?: string;
  metadata?: Record<string, string>;
}) => {
  const stripe = getStripe();
  const {
    amount,
    currency = "usd",
    destinationAccountId,
    description,
    metadata,
  } = params;

  if (!amount || amount <= 0) {
    throw new Error("Transfer amount must be greater than zero");
  }

  return stripe.transfers.create({
    amount: toMinorUnits(amount),
    currency: currency.toLowerCase(),
    destination: destinationAccountId,
    description,
    metadata,
  });
};
