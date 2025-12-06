import Stripe from "stripe";
import { config } from "../../config/env";
import { Subscription } from "../../models/Subscription";
import { User } from "../../models/User";
import bcrypt from "bcrypt";
import { sendSubscriptionEmail } from "../../services/mailService";

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-11-17.clover",
  typescript: true
});

const generatePassword = (): string => {
  const length = 8;
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = lowercase + uppercase + numbers + special;
  
  let password = "";
  
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export interface CheckoutData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export const createCheckoutSession = async (data: CheckoutData, successUrl: string, cancelUrl: string) => {
  const { email, firstName, lastName, phone } = data;

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "SolveMyAllergies Subscription",
              description: `One-time payment for ${firstName} ${lastName}`,
            },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "required",
      metadata: {
        email,
        firstName,
        lastName,
        phone,
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    throw new Error(error?.message || "Failed to create checkout session");
  }
};

const processSubscription = async (session: Stripe.Checkout.Session) => {
  if (session.payment_status !== "paid") {
    throw new Error("Payment not completed");
  }

  const { email, firstName, lastName, phone } = session.metadata || {};
  
  if (!email || !firstName || !lastName || !phone) {
    throw new Error("Missing customer information");
  }

  let paymentIntent: Stripe.PaymentIntent | null = null;
  if (session.payment_intent) {
    paymentIntent = await stripe.paymentIntents.retrieve(
      typeof session.payment_intent === "string" 
        ? session.payment_intent 
        : session.payment_intent.id
    );
  }

  if (paymentIntent && paymentIntent.status !== "succeeded") {
    throw new Error("Payment intent status is not succeeded");
  }

  if (paymentIntent) {
    const paymentMethod = paymentIntent.payment_method;
    if (paymentMethod && typeof paymentMethod === "string") {
      const pm = await stripe.paymentMethods.retrieve(paymentMethod);
      if (pm.card) {
        const cardLast4 = pm.card.last4;
        const cardBrand = pm.card.brand;
        const cardExpMonth = pm.card.exp_month;
        const cardExpYear = pm.card.exp_year;
        
        console.log(`Payment verified - Card: ${cardBrand} ****${cardLast4}, Exp: ${cardExpMonth}/${cardExpYear}`);
      }
    }
  }

  const existingSubscription = await Subscription.findOne({ email, status: "active" });
  if (existingSubscription) {
    throw new Error("User already has an active subscription");
  }

  const password = generatePassword();
  const hashedPassword = await bcrypt.hash(password, 10);

  let user;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.status === "Blocked") {
      throw new Error("Account is blocked. Cannot create subscription");
    }
    existingUser.password = hashedPassword;
    existingUser.name = `${firstName} ${lastName}`;
    existingUser.activity = new Date();
    await existingUser.save();
    user = existingUser;
  } else {
    user = await User.create({
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      role: "user",
      status: "Active",
      activity: new Date()
    });
  }

  let customerId = "";
  if (session.customer) {
    customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
  } else if (session.customer_email) {
    const customer = await stripe.customers.create({ email: session.customer_email });
    customerId = customer.id;
  }

  const paymentIntentId = session.payment_intent 
    ? (typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id)
    : "";

  let priceId = "";
  if (session.line_items) {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    if (lineItems.data.length > 0 && lineItems.data[0].price) {
      priceId = typeof lineItems.data[0].price === "string" 
        ? lineItems.data[0].price 
        : lineItems.data[0].price.id;
    }
  }

  await Subscription.create({
    email,
    firstName,
    lastName,
    phone,
    userId: user._id.toString(),
    stripeCustomerId: customerId,
    stripeSubscriptionId: paymentIntentId || session.id,
    stripePriceId: priceId || "one-time-payment",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });

  await sendSubscriptionEmail(email, firstName, lastName, password);

  return {
    success: true,
    message: "Subscription processed successfully",
    email,
    sessionId: session.id
  };
};

export const handleWebhookEvent = async (event: Stripe.Event) => {
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === "payment" && session.payment_status === "paid") {
        const result = await processSubscription(session);
        console.log(`Webhook processed: ${result.message} for ${result.email}`);
        return result;
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment intent succeeded: ${paymentIntent.id}`);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment intent failed: ${paymentIntent.id}`);
      throw new Error(`Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}`);
    }

    return { success: true, message: "Event processed" };
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    throw new Error(error?.message || "Failed to process webhook event");
  }
};

export const handleCheckoutSuccess = async (sessionId: string) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const result = await processSubscription(session);

    return {
      success: true,
      message: "Payment verified successfully"
    };
  } catch (error: any) {
    throw new Error(error?.message || "Failed to process subscription");
  }
};