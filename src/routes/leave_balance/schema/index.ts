import { z } from "zod";

export const createLeaveBalanceSchema = z.object({
  year: z.number(),
  initialBalance: z.number(),
  remainingBalance: z.number(),
  usedBalance: z.number().optional(),
  userId: z.string(),
  typeCongeId: z.number(),
});

export const updateLeaveBalanceSchema = z.object({
  year: z.number().optional(),
  initialBalance: z.number().optional(),
  remainingBalance: z.number().optional(),
  usedBalance: z.number().optional(),
  typeCongeId: z.number().optional(),
});
