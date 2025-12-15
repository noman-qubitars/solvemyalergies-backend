import { Request } from "express";

export interface CheckoutRequestBody {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const validateCheckoutFields = (body: CheckoutRequestBody): { valid: boolean; error?: string } => {
  if (!body.email || !body.firstName || !body.lastName || !body.phone) {
    return { valid: false, error: "All fields are required" };
  }
  return { valid: true };
};

export const getFrontendUrl = (req: Request): string => {
  return process.env.FRONTEND_URL || (req.headers.origin as string) || "http://localhost:3000";
};

export const buildSuccessUrl = (frontendUrl: string): string => {
  return `${frontendUrl}/webinar/subscription?payment=success`;
};

export const buildCancelUrl = (frontendUrl: string): string => {
  return `${frontendUrl}/webinar/subscription?canceled=true`;
};

