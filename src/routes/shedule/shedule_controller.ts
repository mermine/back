// schedule_controller.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createScheduleSchema, updateScheduleSchema } from "./schema/index";
import { authMiddleware } from "@/middlewares/auth_middleware";
import { roleMiddleware } from "@/middlewares/role_middleware";
import { Role } from "@prisma/client";
import { ResponseTemplate } from "@/constants";
import { z } from "zod";

type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

const scheduleApp = new Hono().use("*", authMiddleware);

// ➕ Create a schedule
scheduleApp.post(
  "/create",
  roleMiddleware([Role.ADMIN, Role.CHEF_SERVICE]),
  zValidator("json", createScheduleSchema),
  async (c) => {
    const data = c.req.valid("json") as CreateScheduleInput;
    const user = c.get("user");

    try {
      // Check for overlapping schedules for the same user
      const existingSchedule = await db.schedule.findFirst({
        where: {
          userId: data.userId,
          date: new Date(data.date),
          OR: [
            {
              AND: [
                { startTime: { lte: new Date(data.startTime) } },
                { endTime: { gt: new Date(data.startTime) } },
              ],
            },
            {
              AND: [
                { startTime: { lt: new Date(data.endTime) } },
                { endTime: { gte: new Date(data.endTime) } },
              ],
            },
            {
              AND: [
                { startTime: { gte: new Date(data.startTime) } },
                { endTime: { lte: new Date(data.endTime) } },
              ],
            },
          ],
        },
      });

      if (existingSchedule) {
        return c.json(
          ResponseTemplate.error("Schedule conflicts with existing schedule"),
          400
        );
      }

      // Validate that end time is after start time
      if (new Date(data.endTime) <= new Date(data.startTime)) {
        return c.json(
          ResponseTemplate.error("End time must be after start time"),
          400
        );
      }

      const schedule = await db.schedule.create({
        data: {
          date: new Date(data.date),
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          service: data.service,
          userId: data.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
              service: true,
            },
          },
        },
      });

      return c.json(
        ResponseTemplate.success("Schedule created successfully", schedule),
        201
      );
    } catch (err) {
      console.error("Error creating schedule:", err);
      return c.json(ResponseTemplate.error("Failed to create schedule"), 500);
    }
  }
);

// 🔁 Update a schedule
scheduleApp.put(
  "/update/:id",
  roleMiddleware([Role.ADMIN, Role.CHEF_SERVICE]),
  zValidator("json", updateScheduleSchema),
  async (c) => {
    const { id } = c.req.param();
    const data = c.req.valid("json") as UpdateScheduleInput;
    const user = c.get("user");

    try {
      // Check if schedule exists
      const existingSchedule = await db.schedule.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!existingSchedule) {
        return c.json(ResponseTemplate.error("Schedule not found"), 404);
      }

      // Prepare update data
      const updateData: any = {};

      if (data.date) {
        updateData.date = new Date(data.date);
      }
      if (data.startTime) {
        updateData.startTime = new Date(data.startTime);
      }
      if (data.endTime) {
        updateData.endTime = new Date(data.endTime);
      }
      if (data.service) {
        updateData.service = data.service;
      }

      // Validate time consistency if both times are being updated
      const finalStartTime = updateData.startTime || existingSchedule.startTime;
      const finalEndTime = updateData.endTime || existingSchedule.endTime;

      if (finalEndTime <= finalStartTime) {
        return c.json(
          ResponseTemplate.error("End time must be after start time"),
          400
        );
      }

      // Check for conflicts if date or times are being changed
      if (data.date || data.startTime || data.endTime) {
        const conflictingSchedule = await db.schedule.findFirst({
          where: {
            id: { not: id }, // Exclude current schedule
            userId: existingSchedule.userId,
            date: updateData.date || existingSchedule.date,
            OR: [
              {
                AND: [
                  { startTime: { lte: finalStartTime } },
                  { endTime: { gt: finalStartTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: finalEndTime } },
                  { endTime: { gte: finalEndTime } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: finalStartTime } },
                  { endTime: { lte: finalEndTime } },
                ],
              },
            ],
          },
        });

        if (conflictingSchedule) {
          return c.json(
            ResponseTemplate.error("Schedule conflicts with existing schedule"),
            400
          );
        }
      }

      const updated = await db.schedule.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
              service: true,
            },
          },
        },
      });

      return c.json(
        ResponseTemplate.success("Schedule updated successfully", updated),
        200
      );
    } catch (err) {
      console.error("Error updating schedule:", err);
      return c.json(ResponseTemplate.error("Failed to update schedule"), 500);
    }
  }
);

// 📄 Get all schedules
scheduleApp.get(
  "/all",
  roleMiddleware([Role.ADMIN, Role.CHEF_SERVICE]),
  async (c) => {
    try {
      const { date, userId, service } = c.req.query();

      const whereClause: any = {};

      if (date) {
        whereClause.date = new Date(date);
      }
      if (userId) {
        whereClause.userId = userId;
      }
      if (service) {
        whereClause.service = service;
      }

      const schedules = await db.schedule.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
              service: true,
            },
          },
        },
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
      });

      return c.json(
        ResponseTemplate.success("Schedules fetched successfully", schedules),
        200
      );
    } catch (err) {
      console.error("Error fetching schedules:", err);
      return c.json(ResponseTemplate.error("Failed to fetch schedules"), 500);
    }
  }
);

// 📄 Get user's schedules (for current user or specific user for admins)
scheduleApp.get("/user/:userId?", async (c) => {
  const currentUser = c.get("user");
  const { userId } = c.req.param();

  // If userId is provided, check if user has permission to view other's schedules
  const targetUserId = userId || currentUser.id;

  if (
    userId &&
    userId !== currentUser.id &&
    currentUser.role !== Role.ADMIN &&
    currentUser.role !== Role.CHEF_SERVICE
  ) {
    return c.json(
      ResponseTemplate.error("Unauthorized to view other user's schedules"),
      403
    );
  }

  try {
    const { date, month, year } = c.req.query();

    const whereClause: any = { userId: targetUserId };

    if (date) {
      whereClause.date = new Date(date);
    } else if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const schedules = await db.schedule.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            service: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return c.json(
      ResponseTemplate.success(
        "User schedules fetched successfully",
        schedules
      ),
      200
    );
  } catch (err) {
    console.error("Error fetching user schedules:", err);
    return c.json(
      ResponseTemplate.error("Failed to fetch user schedules"),
      500
    );
  }
});

// 📄 Get one schedule by ID
scheduleApp.get("/show/:id", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");

  try {
    const schedule = await db.schedule.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            service: true,
          },
        },
      },
    });

    if (!schedule) {
      return c.json(ResponseTemplate.error("Schedule not found"), 404);
    }

    // Check if user has permission to view this schedule
    if (
      schedule.userId !== user.id &&
      user.role !== Role.ADMIN &&
      user.role !== Role.CHEF_SERVICE
    ) {
      return c.json(
        ResponseTemplate.error("Unauthorized to view this schedule"),
        403
      );
    }

    return c.json(ResponseTemplate.success("Schedule found", schedule), 200);
  } catch (err) {
    console.error("Error fetching schedule:", err);
    return c.json(ResponseTemplate.error("Failed to fetch schedule"), 500);
  }
});

// ❌ Delete a schedule
scheduleApp.delete(
  "/delete/:id",
  roleMiddleware([Role.ADMIN, Role.CHEF_SERVICE]),
  async (c) => {
    const { id } = c.req.param();

    try {
      const schedule = await db.schedule.findUnique({
        where: { id },
      });

      if (!schedule) {
        return c.json(ResponseTemplate.error("Schedule not found"), 404);
      }

      await db.schedule.delete({ where: { id } });

      return c.json(
        ResponseTemplate.success("Schedule deleted successfully"),
        200
      );
    } catch (err) {
      console.error("Error deleting schedule:", err);
      return c.json(ResponseTemplate.error("Failed to delete schedule"), 500);
    }
  }
);

export default scheduleApp;
