import "dotenv/config";
import { z } from "zod";

console.log("🔐 Loading environment variables...");

const serverSchema = z.object({
  // Node
  PORT: z.string().min(1).default("3001"),
  JWT_SECRET: z.string().min(1, "JWT secret is required"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
});

const _serverEnv = serverSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error("❌ Invalid environment variables:\n");
  _serverEnv.error.issues.forEach((issue) => {
    console.error(issue);
  });
  throw new Error("Invalid environment variables");
}

const { PORT, DATABASE_URL, JWT_SECRET } = _serverEnv.data;

export const env = {
  PORT,
  DATABASE_URL,
  JWT_SECRET,
};
console.log("✅ Environment variables loaded");
