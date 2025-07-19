import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createLeaveBalanceSchema, updateLeaveBalanceSchema } from "./schema/index";
import { differenceInDays } from "date-fns";

const leaveBalanceApp = new Hono();

// Create leave balance (admin)
leaveBalanceApp.post("/create", zValidator("json", createLeaveBalanceSchema), async (c) => {
  const data = c.req.valid("json");
  try {
    const leaveBalance = await db.leaveBalance.create({ data }); // Fixed: Changed leave_Balance to leaveBalance
    return c.json({ message: "Leave balance created", leaveBalance });
  } catch (err) {
    console.error("Error creating leave balance:", err);
    return c.json({ error: "Failed to create leave balance" }, 500);
  }
});

// Update leave balance manually
leaveBalanceApp.put("/update/:id", zValidator("json", updateLeaveBalanceSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");
  try {
    const updated = await db.leaveBalance.update({ where: { id }, data });
    return c.json({ message: "Leave balance updated", updated });
  } catch (err) {
    console.error("Update error:", err);
    return c.json({ error: "Leave balance not found or update failed" }, 404);
  }
});

// Update leave balance automatically after leave approval
leaveBalanceApp.put("/update-on-leave/:userId", async (c) => {
  const { userId } = c.req.param();
  const body = await c.req.json();
  const { startDate, endDate } = body;

  try {
    const days = differenceInDays(new Date(endDate), new Date(startDate));

    const updated = await db.leaveBalance.updateMany({
      where: {
        userId,
        year: new Date().getFullYear(),
      },
      data: {
        usedBalance: { increment: days },
        remainingBalance: { decrement: days },
      },
    });

    return c.json({ message: "Leave balance updated based on leave", updated });
  } catch (err) {
    console.error("Error updating leave balance on leave:", err);
    return c.json({ error: "Failed to update leave balance based on leave" }, 500);
  }
});

// Get all leave balances
leaveBalanceApp.get("/all", async (c) => {
  try {
    const balances = await db.leaveBalance.findMany({ include: { user: true } });
    return c.json({ message: "Leave balances fetched", balances });
  } catch (err) {
    return c.json({ error: "Failed to fetch leave balances" }, 500);
  }
});

// Get leave balance by id
leaveBalanceApp.get("/show/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const balance = await db.leaveBalance.findUnique({ where: { id }, include: { user: true } });
    if (!balance) return c.json({ error: "Leave balance not found" }, 404);
    return c.json({ message: "Leave balance found", balance });
  } catch (err) {
    return c.json({ error: "Failed to fetch leave balance" }, 500);
  }
});

// Delete leave balance
leaveBalanceApp.delete("/delete/:id", async (c) => {
  const { id } = c.req.param();
  try {
    await db.leaveBalance.delete({ where: { id } });
    return c.json({ message: "Leave balance deleted" });
  } catch (err) {
    return c.json({ error: "Delete failed" }, 500);
  }
});

export default leaveBalanceApp;