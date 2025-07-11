// schema/childrenSchema.ts
import { z } from "zod";

export const createChildSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Gender must be male, female, or other" }),
  }),
});

export const updateChildSchema = z.object({
  name: z.string().min(1).optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});
