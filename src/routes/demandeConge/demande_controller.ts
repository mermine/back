import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createDemandeSchema, updateDemandeSchema } from "./schema/";

const demandeApp = new Hono()

// Create Demande
.post("/create", zValidator("json", createDemandeSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    const demande = await db.DemandeDeConge.create({ data });
    return c.json({ message: "Demande created", demande });
  } catch (err) {
    console.error("Error creating demande:", err);
    return c.json({ error: "Failed to create demande" }, 500);
  }
})

// Update Demande
.put("/update/:id", zValidator("json", updateDemandeSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  try {
    const updated = await db.demandeDeConge.update({ where: { id }, data });
    return c.json({ message: "Demande updated", updated });
  } catch (err) {
    return c.json({ error: "Failed to update demande" }, 500);
  }
})

// Get all Demandes
.get("/all", async (c) => {
  try {
    const demandes = await db.demandeDeConge.findMany({
      include: {
        user: true,
        typeConge: true,
      },
    });
    return c.json({ message: "Demandes fetched", demandes });
  } catch (err) {
    return c.json({ error: "Failed to fetch demandes" }, 500);
  }
})

// Get single Demande
.get("/affiche/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const demande = await db.demandedeconge.findUnique({
      where: { id },
      include: {
        user: true,
        typeConge: true,
      },
    });
    if (!demande) return c.json({ error: "Demande not found" }, 404);
    return c.json({ message: "Demande fetched", demande });
  } catch (err) {
    return c.json({ error: "Failed to fetch demande" }, 500);
  }
})

// Delete Demande
.delete("/delete/:id", async (c) => {
  const { id } = c.req.param();
  try {
    await db.DemandeDeConge.delete({ where: { id } });
    return c.json({ message: "Demande deleted" });
  } catch (err) {
    return c.json({ error: "Failed to delete demande" }, 500);
  }
});

export default demandeApp;
