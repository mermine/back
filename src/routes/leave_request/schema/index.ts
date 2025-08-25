import { z } from "zod";
import { LeaveStatus } from "@prisma/client";

export const createLeaveRequestSchema = z.object({
  typeCongeId: z.string().min(1, "Type of leave ID is required"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  status: z.nativeEnum(LeaveStatus).optional(),
  comment: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

export const updateLeaveRequestSchema = createLeaveRequestSchema.partial();
