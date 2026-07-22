import { OAuth2Client } from "google-auth-library";
import { config } from "../../../config/env";

const client = new OAuth2Client(config.google.webClientId);

export interface GoogleProfile {
  email: string;
  name?: string;
  picture?: string;
}

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.webClientId,
    });
  } catch {
    throw new Error("Invalid Google token");
  }

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Invalid Google token");
  }

  if (payload.email_verified === false) {
    throw new Error("Google email is not verified");
  }

  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
};
