import { ServiceEnum } from "@prisma/client";
import { z } from "zod";

export const createScheduleSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  service: z
    .nativeEnum(ServiceEnum)
    .default(ServiceEnum.ANESTHESIOLOGY)
    .optional(),
  userId: z.string(),
});

export const updateScheduleSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  service: z
    .nativeEnum(ServiceEnum)
    .default(ServiceEnum.ANESTHESIOLOGY)
    .optional(),
});
