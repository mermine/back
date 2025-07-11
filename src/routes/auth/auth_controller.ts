import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import argon2 from "argon2";
import { registerSchema, updateUserSchema } from "./schema";
import { db } from "@/lib/prisma_client";

const app = new Hono()
  .post("/register", zValidator("json", registerSchema), async (c) => {
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
  })
  .put("/update/:id", zValidator("json", updateUserSchema), async (c) => {
    try {
      const {
        cinNumber,
        cnssNumber,
        dateOfBirth,
        jobTitle,
        maritalStatus,
        name,
        nationality,
        phone,
        service,
      } = c.req.valid("json");

      const { id } = c.req.param();

      // Check if the user exists
      const user = await db.user.findUnique({
        where: { id },
      });

      if (!user) {
        return c.json({ error: "User not found." }, 404);
      }

      // Update the user in the database
      const updatedUser = await db.user.update({
        where: { id },
        data: {
          name,
          phone,
          dateOfBirth,
          jobTitle,
          maritalStatus,
          cinNumber,
          cnssNumber,
          nationality,
          service,
        },
      });

      return c.json({
        message: "User updated successfully.",
        updatedUser,
      });
    } catch (error) {
      console.error("Error during update:", error);
      return c.json({ error: "An error occurred during update." }, 500);
    }
  })
  .get("/all", async (c) => {
    try {
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          dateOfBirth: true,
          cinNumber: true,
          cnssNumber: true,
          maritalStatus: true,
          jobTitle: true,
          service: true,
        },
      });

      return c.json({ message: "Users fetched successfully.", data: users });
    } catch (error) {
      console.error("Error fetching users:", error);
      return c.json({ error: "An error occurred while fetching users." }, 500);
    }
  })
  .get("/affiche/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          dateOfBirth: true,
          cinNumber: true,
          cnssNumber: true,
          maritalStatus: true,
          jobTitle: true,
          service: true,
        },
      });
      if (!user) {
      return c.json({ error: "User not found." }, 404);
    }

    return c.json({ message: "User fetched successfully.", data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "An error occurred while fetching user." }, 500);
  }
})
.delete("/delete/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const user = await db.user.findUnique({ where: { id } });

    if (!user) {
      return c.json({ error: "User not found." }, 404);
    }

    await db.user.delete({ where: { id } });

    return c.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "An error occurred while deleting user." }, 500);
  }
})


export default app;
