import { LeaveTypeEnum, Service } from "@prisma/client";
import { z } from "zod";

export const createScheduleSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  service: z.nativeEnum(Service).optional(),
  userId: z.string(),
});

export const updateScheduleSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  service: z.nativeEnum(Service).optional(),
});