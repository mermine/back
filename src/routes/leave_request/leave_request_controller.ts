import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createLeaveRequestSchema, updateLeaveRequestSchema } from "./schema/";

const leaveRequestApp = new Hono()

  // Create LeaveRequest
  .post("/create", zValidator("json", createLeaveRequestSchema), async (c) => {
    const data = c.req.valid("json");

    try {
      const leaveRequest = await db.leaveRequest.create({ data });
      return c.json({ message: "Leave request created", leaveRequest });
    } catch (err) {
      console.error("Error creating leave request:", err);
      return c.json({ error: "Failed to create leave request" }, 500);
    }
  })
  .put(
    "/update/:id",
    zValidator("json", updateLeaveRequestSchema),
    async (c) => {
      const { id } = c.req.param();
      const data = c.req.valid("json");

      try {
        const updated = await db.leaveRequest.update({ where: { id }, data });
        return c.json({ message: "Leave request updated", updated });
      } catch (err) {
        return c.json({ error: "Failed to update leave request" }, 500);
      }
    }
  )
  .get("/all", async (c) => {
    try {
      const leaveRequests = await db.leaveRequest.findMany({
        include: {
          user: true,
          typeConge: true,
        },
      });
      return c.json({ message: "Leave requests fetched", leaveRequests });
    } catch (err) {
      return c.json({ error: "Failed to fetch leave requests" }, 500);
    }
  })
  .get("/affiche/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const leaveRequest = await db.leaveRequest.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          typeConge: true,
        },
      });
      if (!leaveRequest)
        return c.json({ error: "Leave request not found" }, 404);
      return c.json({ message: "Leave request fetched", leaveRequest });
    } catch (err) {
      return c.json({ error: "Failed to fetch leave request" }, 500);
    }
  })
  .delete("/delete/:id", async (c) => {
    const { id } = c.req.param();
    try {
      await db.leaveRequest.delete({ where: { id } });
      return c.json({ message: "Leave request deleted" });
    } catch (err) {
      return c.json({ error: "Failed to delete leave request" }, 500);
    }
  });

export default leaveRequestApp;
