import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createLeaveTypeSchema, updateLeaveTypeSchema } from "./schema";

const leaveTypeApp = new Hono()

  // Create LeaveType
  .post("/create", zValidator("json", createLeaveTypeSchema), async (c) => {
    const data = c.req.valid("json");

    try {
      const leaveType = await db.leaveType.create({ data });
      return c.json({ message: "Leave type created", leaveType });
    } catch (err) {
      console.error("Error creating leave type:", err);
      return c.json({ error: "Failed to create leave type" }, 500);
    }
  })

  // Update LeaveType
  .put("/update/:id", zValidator("json", updateLeaveTypeSchema), async (c) => {
    const { id } = c.req.param();
    const data = c.req.valid("json");

    try {
      const updated = await db.leaveType.update({ where: { id }, data });
      return c.json({ message: "Leave type updated", updated });
    } catch (err) {
      console.error("Error updating leave type:", err);
      return c.json({ error: "Leave type not found" }, 404);
    }
  })

  // Get all LeaveTypes
  .get("/all", async (c) => {
    try {
      const leaveTypes = await db.leaveType.findMany();
      return c.json({ message: "Leave types fetched", leaveTypes });
    } catch (err) {
      console.error("Error fetching leave types:", err);
      return c.json({ error: "Failed to fetch leave types" }, 500);
    }
  })

  // Get single LeaveType
  .get("/affiche/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const leaveType = await db.leaveType.findUnique({ where: { id } });
      if (!leaveType) return c.json({ error: "Leave type not found" }, 404);
      return c.json({ message: "Leave type fetched", leaveType });
    } catch (err) {
      return c.json({ error: "Error" }, 500);
    }
  })

  // Delete LeaveType
  .delete("/delete/:id", async (c) => {
    const { id } = c.req.param();
    try {
      await db.leaveType.delete({ where: { id } });
      return c.json({ message: "Leave type deleted" });
    } catch (err) {
      return c.json({ error: "Failed to delete leave type" }, 500);
    }
  });

export default leaveTypeApp;
