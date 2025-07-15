import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createTypeCongeSchema, updateTypeCongeSchema } from "./Schema";

const typeApp = new Hono()

// Create TypeConge
.post("/create", zValidator("json", createTypeCongeSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    const typeConge = await db.typeconge.create({ data });
    return c.json({ message: "Type created", typeConge });
  } catch (err) {
    console.error("Error creating type:", err);
    return c.json({ error: "Failed to create type" }, 500);
  }
})

// Update TypeConge
.put("/update/:id", zValidator("json", updateTypeCongeSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  try {
    const updated = await db.typeconge.update({ where: { id }, data });
    return c.json({ message: "Type updated", updated });
  } catch (err) {
    console.error("Error updating type:", err);
    return c.json({ error: "Type not found" }, 404);
  }
})

// Get all TypeConge
.get("/all", async (c) => {
  try {
    const types = await db.typeconge.findMany();
    return c.json({ message: "Types fetched", types });
  } catch (err) {
    console.error("Error fetching types:", err);
    return c.json({ error: "Failed to fetch types" }, 500);
  }
})

// Get single TypeConge
.get("/affiche/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const type = await db.typeconge.findUnique({ where: { id } });
    if (!type) return c.json({ error: "Type not found" }, 404);
    return c.json({ message: "Type fetched", type });
  } catch (err) {
    return c.json({ error: "Error" }, 500);
  }
})

// Delete TypeConge
.delete("/delete/:id", async (c) => {
  const { id } = c.req.param();
  try {
    await db.typeconge.delete({ where: { id } });
    return c.json({ message: "Type deleted" });
  } catch (err) {
    return c.json({ error: "Failed to delete type" }, 500);
  }
});

export default typeApp;
