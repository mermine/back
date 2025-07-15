import { z } from "zod";

export const createTypeCongeSchema = z.object({
  nom: z.string().min(2),
  description: z.string().optional(),
});

export const updateTypeCongeSchema = z.object({
  nom: z.string().min(2).optional(),
  description: z.string().optional(),
});
