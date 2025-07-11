import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { db } from "@/lib/prisma_client";
import { createChildSchema, updateChildSchema } from "./schema";

const childrenApp = new Hono()

// Create child
.post("/create", zValidator("json", createChildSchema), async (c) => {
  try {
    const {
      userId,      // assuming each child is linked to a user
      name,
      dateOfBirth,
      gender,
    } = c.req.valid("json");

    const newChild = await db.child.create({
      data: {
        name,
        dateOfBirth,
        gender,
        userId,
      },
    });

    return c.json({ message: "Child created successfully.", newChild });
  } catch (error) {
    console.error("Error creating child:", error);
    return c.json({ error: "Failed to create child." }, 500);
  }
})

// Update child
.put("/update/:id", zValidator("json", updateChildSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  try {
    const child = await db.child.findUnique({ where: { id } });
    if (!child) {
      return c.json({ error: "Child not found." }, 404);
    }

    const updatedChild = await db.child.update({
      where: { id },
      data,
    });

    return c.json({ message: "Child updated successfully.", updatedChild });
  } catch (error) {
    console.error("Error updating child:", error);
    return c.json({ error: "Failed to update child." }, 500);
  }
})

// Get all children
.get("/all", async (c) => {
  try {
    const children = await db.child.findMany();
    return c.json({ message: "Children fetched successfully.", data: children });
  } catch (error) {
    console.error("Error fetching children:", error);
    return c.json({ error: "Failed to fetch children." }, 500);
  }
})

// Get child by ID
.get("/affiche/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const child = await db.child.findUnique({ where: { id } });
    if (!child) return c.json({ error: "Child not found." }, 404);

    return c.json({ message: "Child fetched successfully.", data: child });
  } catch (error) {
    console.error("Error fetching child:", error);
    return c.json({ error: "Failed to fetch child." }, 500);
  }
})

// Delete child
.delete("/delete/:id", async (c) => {
  const { id } = c.req.param();
  try {
    await db.child.delete({ where: { id } });
    return c.json({ message: "Child deleted successfully." });
  } catch (error) {
    console.error("Error deleting child:", error);
    return c.json({ error: "Failed to delete child." }, 500);
  }
});

export default childrenApp;
