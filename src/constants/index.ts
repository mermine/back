import { env } from "@/dotenv_config";
import { CODE_EXPIRY_MINUTES } from "@/service/email_service";
import { randomInt } from "crypto";
import jwt from "jsonwebtoken";

export const TOKEN_EXPIRY = {
  AUTH: "24h",
  PASSWORD_RESET: "15m",
} as const;

export const generateSixDigitCode = (): string =>
  randomInt(100000, 999999).toString();

export const generateResetCodeExpiry = (): Date =>
  new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

export const generateAuthToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.AUTH });

export const generatePasswordResetToken = (userId: string): string =>
  jwt.sign({ userId, purpose: "password_reset" }, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY.PASSWORD_RESET,
  });

export const verifyPasswordResetToken = (
  token: string
): { userId: string; purpose: string } => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as {
    userId: string;
    purpose: string;
  };
  if (decoded.purpose !== "password_reset") {
    throw new Error("Invalid token purpose");
  }
  return decoded;
};

export const ResponseTemplate = {
  success: (message: string, data?: any) => ({
    success: true,
    message,
    ...(data && { data }),
  }),
  error: (message: string, error?: any) => ({
    success: false,
    message,
    ...(error && { error }),
  }),
};
