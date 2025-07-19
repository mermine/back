// schedule_controller.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createScheduleSchema, updateScheduleSchema } from "./schema/index"; // adjust path if needed
import { z } from "zod"; // ✅ FIXED: required for z.infer

type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

const scheduleApp = new Hono();

// ➕ Create a schedule
scheduleApp.post("/create", zValidator("json", createScheduleSchema), async (c) => {
 const data = c.req.valid("json") as CreateScheduleInput;

  try {
    const schedule = await db.Schedule.create({
      data: {
        date: new Date(data.date as string),
        startTime: new Date(data.startTime as string),
        endTime: new Date(data.endTime as string),
        service: data.service ?? "", // Optional safety fallback
        userId: data.userId,
      },
    });
    return c.json({ message: "Schedule created", schedule });
  } catch (err) {
    console.error("Error creating schedule:", err);
    return c.json({ error: "Failed to create schedule" }, 500);
  }
});

// 🔁 Update a schedule
scheduleApp.put("/update/:id", zValidator("json", updateScheduleSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json") as UpdateScheduleInput;

  try {
    const updated = await db.Schedule.update({
      where: { id },
      data: {
        ...(typeof data.date === "string" && data.date ? { date: new Date(data.date) } : {}),
        ...(typeof data.startTime === "string" && data.startTime ? { startTime: new Date(data.startTime) } : {}),
        ...(typeof data.endTime === "string" && data.endTime ? { endTime: new Date(data.endTime) } : {}),
        ...(data.service ? { service: data.service } : {}),
      },
    });

    return c.json({ message: "Schedule updated", updated });
  } catch (err) {
    console.error("Error updating schedule:", err);
    return c.json({ error: "Failed to update schedule" }, 500);
  }
});

// 📄 Get all schedules
scheduleApp.get("/all", async (c) => {
  try {
    const schedules = await db.Schedule.findMany({
      include: { user: true },
    });
    return c.json({ message: "Schedules fetched", schedules });
  } catch (err) {
    return c.json({ error: "Failed to fetch schedules" }, 500);
  }
});

// 📄 Get one schedule by ID
scheduleApp.get("/show/:id", async (c) => {
  const { id } = c.req.param();

  try {
    const schedule = await db.Schedule.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!schedule) {
      return c.json({ error: "Schedule not found" }, 404);
    }

    return c.json({ message: "Schedule found", schedule });
  } catch (err) {
    return c.json({ error: "Failed to fetch schedule" }, 500);
  }
});

// ❌ Delete a schedule
scheduleApp.delete("/delete/:id", async (c) => {
  const { id } = c.req.param();

  try {
    await db.schedule.delete({ where: { id } });
    return c.json({ message: "Schedule deleted" });
  } catch (err) {
    return c.json({ error: "Failed to delete schedule" }, 500);
  }
});

export default scheduleApp;
