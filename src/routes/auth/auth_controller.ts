import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { db } from "@/lib/prisma_client";
import * as jwt from "jsonwebtoken";
import argon2 from "argon2";
import { env } from "@/dotenv_config";
import { loginSchema, registerSchema } from "./schema";

export const authController = new Hono()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    try {
      const data = c.req.valid("json");

      const existingUser = await db.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return c.json({ error: "User already exists." }, 400);
      }

      const hashedPassword = await argon2.hash(data.password);

      const newUser = await db.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });

      // Generate JWT token after user creation
      const token = jwt.sign(
        {
          userId: newUser.id,
          role: newUser.role,
        },
        env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return c.json({
        message: "User registered successfully.",
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      return c.json({ error: "Registration failed." }, 500);
    }
  })

  .post("/login", zValidator("json", loginSchema), async (c) => {
    try {
      const { email, password } = c.req.valid("json");

      const user = await db.user.findUnique({ where: { email } });

      if (!user) {
        return c.json({ error: "User does not exist." }, 401);
      }

      const valid = await argon2.verify(user.password, password);

      if (!valid) {
        return c.json({ error: "Invalid password." }, 401);
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return c.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token,
        },
      });
    } catch (error) {
      console.log("Login error:", error);
      return c.json({ error: "Login failed." }, 500);
    }
  });
