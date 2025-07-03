import { PrismaClient } from "@prisma/client";

// Initialize Prisma Client for database interaction, with pretty error formatting
export const db = new PrismaClient({
  errorFormat: "pretty",
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
    {
      emit: "event",
      level: "error",
    },
  ],
});
