import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createLeaveRequestSchema, updateLeaveRequestSchema } from "./schema/";
import { authMiddleware } from "@/middlewares/auth_middleware";
import { roleMiddleware } from "@/middlewares/role_middleware";
import { Role, LeaveStatus } from "@prisma/client";
import { ResponseTemplate } from "@/constants";

const leaveRequestApp = new Hono()
  .use("*", authMiddleware)
  .post("/create", zValidator("json", createLeaveRequestSchema), async (c) => {
    try {
      const {
        startDate,
        endDate,
        status,
        reason,
        comment,
        userId,
        typeCongeId,
      } = c.req.valid("json");
      const leaveRequest = await db.leaveRequest.create({
        data: {
          startDate,
          endDate,
          status,
          reason,
          comment,
          user: { connect: { id: userId } },
          typeConge: { connect: { id: Number(typeCongeId) } },
        },
      });

      return c.json(
        ResponseTemplate.success("Leave request created", leaveRequest),
        201
      );
    } catch (err) {
      console.error("Error creating leave request:", err);
      return c.json(
        ResponseTemplate.error("Failed to create leave request"),
        500
      );
    }
  })
  .put(
    "/update/:id",
    zValidator("json", updateLeaveRequestSchema),
    async (c) => {
      const { id } = c.req.param();
      const {
        startDate,
        endDate,
        status,
        reason,
        comment,
        userId,
        typeCongeId,
      } = c.req.valid("json");
      try {
        const existing = await db.leaveRequest.findUnique({ where: { id } });
        if (!existing) {
          return c.json(ResponseTemplate.error("Leave request not found"), 404);
        }
        if (
          existing.status === LeaveStatus.APPROVED ||
          existing.status === LeaveStatus.REJECTED
        ) {
          return c.json(
            ResponseTemplate.error(
              "Cannot update an approved or rejected leave request"
            ),
            400
          );
        }
        const updated = await db.leaveRequest.update({
          where: { id },
          data: {
            startDate,
            endDate,
            status,
            reason,
            comment,
            user: { connect: { id: userId } },
            typeConge: { connect: { id: Number(typeCongeId) } },
          },
        });
        return c.json(
          ResponseTemplate.success("Leave request updated", updated),
          200
        );
      } catch (err) {
        return c.json(
          ResponseTemplate.error("Failed to update leave request"),
          500
        );
      }
    }
  )
  .get("/user", async (c) => {
    try {
      const user = c.get("user");
      const leaveRequests = await db.leaveRequest.findMany({
        where: { userId: user.id },
        include: {
          typeConge: true,
        },
      });
      return c.json(
        ResponseTemplate.success("User leave requests fetched", leaveRequests),
        200
      );
    } catch (error) {
      return c.json(
        ResponseTemplate.error("Failed to fetch user leave requests"),
        500
      );
    }
  })
  .get("/all", roleMiddleware([Role.ADMIN, Role.CHEF_SERVICE]), async (c) => {
    try {
      const leaveRequests = await db.leaveRequest.findMany({
        include: {
          user: true,
          typeConge: true,
        },
      });
      return c.json(
        ResponseTemplate.success("Leave requests fetched", leaveRequests),
        200
      );
    } catch (err) {
      return c.json(
        ResponseTemplate.error("Failed to fetch leave requests"),
        500
      );
    }
  })
  .get("/detail/:id", async (c) => {
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
        return c.json(ResponseTemplate.error("Leave request not found"), 404);
      return c.json(
        ResponseTemplate.success("Leave request fetched", leaveRequest),
        200
      );
    } catch (err) {
      return c.json(
        ResponseTemplate.error("Failed to fetch leave request"),
        500
      );
    }
  })
  .delete("/delete/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const existing = await db.leaveRequest.findUnique({ where: { id } });
      if (!existing)
        return c.json(ResponseTemplate.error("Leave request not found"), 404);
      if (
        existing.status === LeaveStatus.APPROVED ||
        existing.status === LeaveStatus.REJECTED
      ) {
        return c.json(
          ResponseTemplate.error(
            "Cannot delete an approved or rejected leave request"
          ),
          400
        );
      }
      await db.leaveRequest.delete({ where: { id } });
      return c.json(ResponseTemplate.success("Leave request deleted"), 200);
    } catch (err) {
      return c.json(
        ResponseTemplate.error("Failed to delete leave request"),
        500
      );
    }
  });

export default leaveRequestApp;
