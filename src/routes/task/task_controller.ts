import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createTaskSchema, updateTaskSchema } from "./schema/index";

const taskApp = new Hono();

taskApp.post("/create", zValidator("json", createTaskSchema), async (c) => {
  const data = c.req.valid("json");
  const task = await db.task.create({ data });
  return c.json({ message: "Task created", task });
});

taskApp.put("/update/:id", zValidator("json", updateTaskSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");
  const updated = await db.task.update({ where: { id }, data });
  return c.json({ message: "Task updated", updated });
});

taskApp.get("/all", async (c) => {
  const tasks = await db.task.findMany({ include: { user: true } });
  return c.json({ message: "Tasks fetched", tasks });
});

taskApp.get("/show/:id", async (c) => {
  const { id } = c.req.param();
  const task = await db.task.findUnique({ where: { id }, include: { user: true } });
  return task ? c.json({ message: "Task found", task }) : c.json({ error: "Not found" }, 404);
});

taskApp.delete("/delete/:id", async (c) => {
  await db.task.delete({ where: { id: c.req.param().id } });
  return c.json({ message: "Task deleted" });
});

export default taskApp;
