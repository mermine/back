import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import argon2 from "argon2";
import { registerSchema } from "./schema";
import { db } from "@/lib/prisma_client";

const app = new Hono().post(
  "/register",
  zValidator("json", registerSchema),
  async (c) => {
    try {
      const {
        service,
        cinNumber,
        cnssNumber,
        dateOfBirth,
        email,
        jobTitle,
        maritalStatus,
        name,
        nationality,
        password,
        phone,
        role,
      } = c.req.valid("json");

      // Check if the user already exists
      const user = await db.user.findUnique({ where: { email } });

      if (user) {
        return c.json({ error: "User already exists." }, 400);
      }

      const hashedPassword = await argon2.hash(password);

      //  create the user in the database

      const newUser = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role,
          dateOfBirth,
          cinNumber,
          cnssNumber,
          jobTitle,
          maritalStatus,
          nationality,
          service,
        },
      });

      return c.json({
        message: "User registered successfully.",
        newUser,
      });
    } catch (error) {
      console.error("Error during registration:", error);
      return c.json({ error: "An error occurred during registration." }, 500);
    }
  }
);

export default app;
