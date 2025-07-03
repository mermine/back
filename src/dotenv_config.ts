import "dotenv/config";
import { z } from "zod";

console.log("🔐 Loading environment variables...");

const serverSchema = z.object({
  // Node
  PORT: z.string().min(1),
});

const _serverEnv = serverSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error("❌ Invalid environment variables:\n");
  _serverEnv.error.issues.forEach((issue) => {
    console.error(issue);
  });
  throw new Error("Invalid environment variables");
}

const { PORT } = _serverEnv.data;

export const env = {
  PORT,
};
console.log("✅ Environment variables loaded");
