import { z } from "zod";

export const createDemandeSchema = z.object({
  userId: z.string().min(1),
  typeCongeId: z.string().min(1),
  dateDebut: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid date format",
  }),
  dateFin: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid date format",
  }),
  motif: z.string().optional(),
  statut: z.enum(["en attente", "accepté", "rejeté"]),
});

export const updateDemandeSchema = createDemandeSchema.partial();
