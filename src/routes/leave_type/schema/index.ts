import { LeaveTypeEnum } from "@prisma/client";
import { z } from "zod";

export const createLeaveTypeSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.nativeEnum(LeaveTypeEnum).optional(),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();
