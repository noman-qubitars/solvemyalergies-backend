export const extractOtpCode = (body: { code?: string; otp?: string }): string | undefined => {
  return body.code || body.otp;
};