// schema/childrenSchema.ts
import { Gender } from "@prisma/client";
import { z } from "zod";

export const createChildSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  gender: z.nativeEnum(Gender).default(Gender.MALE),
  hasDisability: z.boolean().default(false),
});

export const updateChildSchema = createChildSchema.partial();
