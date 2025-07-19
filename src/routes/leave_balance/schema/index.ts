import { z } from "zod";
import { LeaveStatus } from "@prisma/client"; // Keep this import as LeaveStatus might be used elsewhere

export const createLeaveBalanceSchema = z.object({
  year: z.number(),
  initialBalance: z.number(),
  remainingBalance: z.number(),
  usedBalance: z.number().optional(),
  userId: z.string(),
});

export const updateLeaveBalanceSchema = z.object({
  year: z.number().optional(),
  initialBalance: z.number().optional(),
  remainingBalance: z.number().optional(),
  usedBalance: z.number().optional(),
});