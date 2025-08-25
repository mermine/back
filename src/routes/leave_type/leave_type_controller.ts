import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createLeaveTypeSchema, updateLeaveTypeSchema } from "./schema";
import { authMiddleware } from "@/middlewares/auth_middleware";
import { roleMiddleware } from "@/middlewares/role_middleware";
import { Role } from "@prisma/client";
import { ResponseTemplate } from "@/constants";

const app = new Hono()
  .get("/all", async (c) => {
    try {
      const leaveTypes = await db.leaveType.findMany();
      return c.json(
        ResponseTemplate.success("Leave types fetched", leaveTypes),
        200
      );
    } catch (err) {
      console.error("Error fetching leave types:", err);
      return c.json(ResponseTemplate.error("Failed to fetch leave types"), 500);
    }
  })
  .get("/detail/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const leaveType = await db.leaveType.findUnique({
        where: { id: Number(id) },
      });
      if (!leaveType) return c.json({ error: "Leave type not found" }, 404);
      return c.json(
        ResponseTemplate.success("Leave type fetched", leaveType),
        200
      );
    } catch (err) {
      return c.json({ error: "Failed to fetch leave type" }, 500);
    }
  })
  .use("*", authMiddleware)
  .post(
    "/create",
    zValidator("json", createLeaveTypeSchema),
    roleMiddleware([Role.ADMIN]),
    async (c) => {
      const data = c.req.valid("json");

      try {
        const leaveType = await db.leaveType.create({ data });
        return c.json(
          ResponseTemplate.success("Leave type created", leaveType),
          201
        );
      } catch (err) {
        console.error("Error creating leave type:", err);
        return c.json(
          ResponseTemplate.error("Failed to create leave type"),
          500
        );
      }
    }
  )
  .put(
    "/update/:id",
    zValidator("json", updateLeaveTypeSchema),
    roleMiddleware([Role.ADMIN]),
    async (c) => {
      const { id } = c.req.param();
      const data = c.req.valid("json");

      try {
        const updated = await db.leaveType.update({
          where: { id: Number(id) },
          data,
        });
        return c.json(
          ResponseTemplate.success("Leave type updated", updated),
          200
        );
      } catch (err) {
        console.error("Error updating leave type:", err);
        return c.json(
          ResponseTemplate.error("Failed to update leave type"),
          500
        );
      }
    }
  )
  .delete("/delete/:id", roleMiddleware([Role.ADMIN]), async (c) => {
    const { id } = c.req.param();
    try {
      await db.leaveType.delete({ where: { id: Number(id) } });
      return c.json(ResponseTemplate.success("Leave type deleted"), 200);
    } catch (err) {
      return c.json(ResponseTemplate.error("Failed to delete leave type"), 500);
    }
  });

export default app;
