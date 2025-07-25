import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { db } from "@/lib/prisma_client";
import { createChildSchema, updateChildSchema } from "./schema";
import { authMiddleware } from "@/middlewares/auth_middleware";

const app = new Hono()
  .use("*", authMiddleware)
  .post("/create", zValidator("json", createChildSchema), async (c) => {
    try {
      const user = c.get("user");
      const { name, dateOfBirth, gender, hasDisability } = c.req.valid("json");

      const newChild = await db.child.create({
        data: {
          name,
          dateOfBirth,
          gender,
          userId: user.id,
          hasDisability,
        },
      });

      return c.json(
        {
          success: true,
          message: "Child created successfully.",
          data: newChild,
        },
        201
      );
    } catch (error) {
      console.error("Error creating child:", error);
      return c.json(
        {
          success: false,
          error: "Failed to create child.",
        },
        500
      );
    }
  })
  .put("/update/:id", zValidator("json", updateChildSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get("user");
      const data = c.req.valid("json");

      // Verify child exists and belongs to user
      const child = await db.child.findUnique({
        where: { id, userId: user.id },
      });

      if (!child) {
        return c.json(
          {
            success: false,
            error: "Child not found or unauthorized.",
          },
          404
        );
      }

      const updatedChild = await db.child.update({
        where: { id },
        data,
      });

      return c.json({
        success: true,
        message: "Child updated successfully.",
        data: updatedChild,
      });
    } catch (error) {
      console.error("Error updating child:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update child.",
        },
        500
      );
    }
  })
  .get("/my", async (c) => {
    try {
      const user = c.get("user");
      const children = await db.child.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
          gender: true,
          hasDisability: true,
          createdAt: true,
        },
      });

      return c.json({
        success: true,
        message: "Children fetched successfully.",
        data: children,
      });
    } catch (error) {
      console.error("Error fetching children:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch children.",
        },
        500
      );
    }
  })
  .get("/detail/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get("user");

      const child = await db.child.findUnique({
        where: { id, userId: user.id },
      });

      if (!child) {
        return c.json(
          {
            success: false,
            error: "Child not found or unauthorized.",
          },
          404
        );
      }

      return c.json({
        success: true,
        message: "Child fetched successfully.",
        data: child,
      });
    } catch (error) {
      console.error("Error fetching child:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch child.",
        },
        500
      );
    }
  })
  .delete("/delete/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get("user");

      // Verify child exists and belongs to user
      const child = await db.child.findUnique({
        where: { id, userId: user.id },
      });

      if (!child) {
        return c.json(
          {
            success: false,
            error: "Child not found or unauthorized.",
          },
          404
        );
      }

      await db.child.delete({ where: { id } });

      return c.json({
        success: true,
        message: "Child deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting child:", error);
      return c.json(
        {
          success: false,
          error: "Failed to delete child.",
        },
        500
      );
    }
  });

export default app;
