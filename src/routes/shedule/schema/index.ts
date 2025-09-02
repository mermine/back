import { ServiceEnum } from "@prisma/client";
import { z } from "zod";

export const createScheduleSchema = z
  .object({
    date: z.string().refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Invalid date format"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    service: z
      .nativeEnum(ServiceEnum)
      .default(ServiceEnum.EMERGENCY)
      .optional(),
    userId: z.string().min(1, "User ID is required"),
  })
  .refine(
    (data) => {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      return endTime > startTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const updateScheduleSchema = z.object({
  date: z
    .string()
    .refine((date) => {
      if (!date) return true; // Optional field
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Invalid date format")
    .optional(),
  startTime: z
    .string()
    .refine((time) => {
      if (!time) return true; // Optional field
      const parsedTime = new Date(time);
      return !isNaN(parsedTime.getTime());
    }, "Invalid start time format")
    .optional(),
  endTime: z
    .string()
    .refine((time) => {
      if (!time) return true; // Optional field
      const parsedTime = new Date(time);
      return !isNaN(parsedTime.getTime());
    }, "Invalid end time format")
    .optional(),
  service: z.nativeEnum(ServiceEnum).optional(),
});
