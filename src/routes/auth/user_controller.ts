import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { authMiddleware } from "@/middlewares/auth_middleware";
import { updateUserSchema } from "./schema";

export const userController = new Hono()
  .use("*", authMiddleware)
  .get("/all", async (c) => {
    try {
      const page = Number(c.req.query("page") || 1);
      const limit = Number(c.req.query("limit") || 10);
      const search = c.req.query("search") || "";
      const skip = (page - 1) * limit;

      const searchFilter = search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {};

      const [totalItems, users] = await Promise.all([
        db.user.count({ where: searchFilter }),
        db.user.findMany({
          skip,
          take: limit,
          where: searchFilter,
          orderBy: { createdAt: "desc" },
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
            createdAt: true,
          },
        }),
      ]);

      return c.json({
        message: "Users fetched successfully.",
        data: users,
        totalItems,
        pageInfo: {
          hasPreviousPage: page > 1,
          hasNextPage: page * limit < totalItems,
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return c.json({ error: "Failed to fetch users." }, 500);
    }
  })
  .get("/my", async (c) => {
    try {
      const userByToken = c.get("user");
      const user = await db.user.findUnique({
        where: { id: userByToken.id },
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

      if (!user) return c.json({ error: "User not found." }, 404);

      return c.json({ message: "User fetched successfully.", data: user });
    } catch (error) {
      console.error("Error fetching user:", error);
      return c.json({ error: "Failed to fetch user." }, 500);
    }
  })
  .put("/update", zValidator("json", updateUserSchema), async (c) => {
    try {
      const userByToken = c.get("user");
      const data = c.req.valid("json");

      const user = await db.user.findUnique({ where: { id: userByToken.id } });

      if (!user) return c.json({ error: "User not found." }, 404);

      const updatedUser = await db.user.update({
        where: { id: userByToken.id },
        data,
      });

      return c.json({
        message: "User updated successfully.",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      return c.json({ error: "Failed to update user." }, 500);
    }
  })
  .delete("/delete", async (c) => {
    try {
      const userByToken = c.get("user");
      const user = await db.user.findUnique({ where: { id: userByToken.id } });
      if (!user) return c.json({ error: "User not found." }, 404);
      await db.user.delete({ where: { id: userByToken.id } });
      return c.json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Error deleting user:", error);
      return c.json({ error: "Failed to delete user." }, 500);
    }
  });
