import { z } from "zod";
import { LeaveStatus, LeaveTypeEnum } from "@prisma/client";

export const createLeaveRequestSchema = z.object({
  typeCongeId: z.string().min(1, "Type of leave ID is required"),
  startDate: z.string().datetime().min(1, "Start date is required"),
  endDate: z.string().datetime().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
  status: z.nativeEnum(LeaveStatus).default(LeaveStatus.PENDING).optional(),
  comment: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

export const assignLeaveRequestSchema = z.object({
  typeCongeId: z.string().min(1, "Type of leave ID is required"),
  startDate: z.string().datetime().min(1, "Start date is required"),
  endDate: z.string().datetime().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
  status: z.nativeEnum(LeaveStatus).default(LeaveStatus.PENDING).optional(),
  comment: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
  userId: z.string().min(1, "User ID is required"),
});

export const updateLeaveRequestSchema = createLeaveRequestSchema.partial();

export const filterLeaveRequestSchema = z.object({
  status: z.nativeEnum(LeaveStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  typeConge: z.nativeEnum(LeaveTypeEnum).optional(),
});
