import "dotenv/config";
import { z } from "zod";

console.log("🔐 Loading environment variables...");

const serverSchema = z.object({
  // Node
  PORT: z.string().min(1).default("3001"),
  JWT_SECRET: z.string().min(1, "JWT secret is required"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SMTP_HOST: z.string().min(1, "SMTP host is required"),
  SMTP_PORT: z.string().min(1, "SMTP port is required"),
  SMTP_USER: z.string().min(1, "SMTP user is required"),
  SMTP_PASSWORD: z.string().min(1, "SMTP password is required"),
  SMTP_FROM_EMAIL: z
    .string()
    .email("Invalid SMTP from email")
    .min(1, "SMTP from email is required"),
  SMTP_FROM_NAME: z.string().min(1, "SMTP from name is required"),
});

const _serverEnv = serverSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error("❌ Invalid environment variables:\n");
  _serverEnv.error.issues.forEach((issue) => {
    console.error(issue);
  });
  throw new Error("Invalid environment variables");
}

const {
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  NODE_ENV,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USER,
} = _serverEnv.data;

export const env = {
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  NODE_ENV,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USER,
};
console.log("✅ Environment variables loaded");
