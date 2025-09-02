import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  dueDate: z
    .string()
    .refine((date) => {
      if (!date) return true; // Optional field
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Invalid due date format")
    .optional(),
  userId: z.string().min(1, "User ID is required"),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  dueDate: z
    .string()
    .refine((date) => {
      if (!date) return true; // Optional field
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Invalid due date format")
    .optional()
    .nullable(),
  isCompleted: z.boolean().optional(),
});
