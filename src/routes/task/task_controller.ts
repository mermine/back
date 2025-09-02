import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import { createTaskSchema, updateTaskSchema } from "./schema/index";
import { authMiddleware } from "@/middlewares/auth_middleware";
import { roleMiddleware } from "@/middlewares/role_middleware";
import { Role } from "@prisma/client";
import { ResponseTemplate } from "@/constants";

const taskApp = new Hono().use("*", authMiddleware);

// Create a new task
taskApp.post(
  "/create",
  roleMiddleware([Role.ADMIN, Role.CHEF_SERVICE]),
  zValidator("json", createTaskSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");

    try {
      // Validate due date if provided
      let dueDate = null;
      if (data.dueDate) {
        dueDate = new Date(data.dueDate);
        if (isNaN(dueDate.getTime())) {
          return c.json(ResponseTemplate.error("Invalid due date format"), 400);
        }
        // Check if due date is in the past
        if (dueDate < new Date()) {
          return c.json(
            ResponseTemplate.error("Due date cannot be in the past"),
            400
          );
        }
      }

      const task = await db.task.create({
        data: {
          title: data.title,
          description: data.description,
          dueDate,
          userId: data.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
              service: true,
            },
          },
        },
      });

      return c.json(
        ResponseTemplate.success("Task created successfully", task),
        201
      );
    } catch (err) {
      console.error("Error creating task:", err);
      return c.json(ResponseTemplate.error("Failed to create task"), 500);
    }
  }
);

// Update a task
taskApp.put("/update/:id", zValidator("json", updateTaskSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");
  const user = c.get("user");

  try {
    // Check if task exists
    const existingTask = await db.task.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingTask) {
      return c.json(ResponseTemplate.error("Task not found"), 404);
    }

    // Check if user has permission to update this task
    if (
      existingTask.userId !== user.id &&
      user.role !== Role.ADMIN &&
      user.role !== Role.CHEF_SERVICE
    ) {
      return c.json(
        ResponseTemplate.error("Unauthorized to update this task"),
        403
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isCompleted !== undefined)
      updateData.isCompleted = data.isCompleted;

    if (data.dueDate !== undefined) {
      if (data.dueDate) {
        const dueDate = new Date(data.dueDate);
        if (isNaN(dueDate.getTime())) {
          return c.json(ResponseTemplate.error("Invalid due date format"), 400);
        }
        updateData.dueDate = dueDate;
      } else {
        updateData.dueDate = null;
      }
    }

    const updated = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            service: true,
          },
        },
      },
    });

    return c.json(
      ResponseTemplate.success("Task updated successfully", updated),
      200
    );
  } catch (err) {
    console.error("Error updating task:", err);
    return c.json(ResponseTemplate.error("Failed to update task"), 500);
  }
});

// Get all tasks (admin/chef service only)
taskApp.get(
  "/all",
  roleMiddleware([Role.ADMIN, Role.CHEF_SERVICE]),
  async (c) => {
    try {
      const { status, userId, overdue } = c.req.query();

      const whereClause: any = {};

      if (status === "completed") {
        whereClause.isCompleted = true;
      } else if (status === "pending") {
        whereClause.isCompleted = false;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      if (overdue === "true") {
        whereClause.dueDate = {
          lt: new Date(),
        };
        whereClause.isCompleted = false;
      }

      const tasks = await db.task.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
              service: true,
            },
          },
        },
        orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }],
      });

      return c.json(
        ResponseTemplate.success("Tasks fetched successfully", tasks),
        200
      );
    } catch (err) {
      console.error("Error fetching tasks:", err);
      return c.json(ResponseTemplate.error("Failed to fetch tasks"), 500);
    }
  }
);

// Get user's tasks (for current user or specific user for admins)
taskApp.get("/user/:userId?", async (c) => {
  const currentUser = c.get("user");
  const { userId } = c.req.param();

  // If userId is provided, check if user has permission to view other's tasks
  const targetUserId = userId || currentUser.id;

  if (
    userId &&
    userId !== currentUser.id &&
    currentUser.role !== Role.ADMIN &&
    currentUser.role !== Role.CHEF_SERVICE
  ) {
    return c.json(
      ResponseTemplate.error("Unauthorized to view other user's tasks"),
      403
    );
  }

  try {
    const { status, overdue } = c.req.query();

    const whereClause: any = { userId: targetUserId };

    if (status === "completed") {
      whereClause.isCompleted = true;
    } else if (status === "pending") {
      whereClause.isCompleted = false;
    }

    if (overdue === "true") {
      whereClause.dueDate = {
        lt: new Date(),
      };
      whereClause.isCompleted = false;
    }

    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            service: true,
          },
        },
      },
      orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }],
    });

    return c.json(
      ResponseTemplate.success("User tasks fetched successfully", tasks),
      200
    );
  } catch (err) {
    console.error("Error fetching user tasks:", err);
    return c.json(ResponseTemplate.error("Failed to fetch user tasks"), 500);
  }
});

// Get a single task by ID
taskApp.get("/show/:id", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");

  try {
    const task = await db.task.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            service: true,
          },
        },
      },
    });

    if (!task) {
      return c.json(ResponseTemplate.error("Task not found"), 404);
    }

    // Check if user has permission to view this task
    if (
      task.userId !== user.id &&
      user.role !== Role.ADMIN &&
      user.role !== Role.CHEF_SERVICE
    ) {
      return c.json(
        ResponseTemplate.error("Unauthorized to view this task"),
        403
      );
    }

    return c.json(ResponseTemplate.success("Task found", task), 200);
  } catch (err) {
    console.error("Error fetching task:", err);
    return c.json(ResponseTemplate.error("Failed to fetch task"), 500);
  }
});

// Mark task as completed/incomplete
taskApp.patch("/toggle/:id", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");

  try {
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task) {
      return c.json(ResponseTemplate.error("Task not found"), 404);
    }

    // Check if user has permission to update this task
    if (
      task.userId !== user.id &&
      user.role !== Role.ADMIN &&
      user.role !== Role.CHEF_SERVICE
    ) {
      return c.json(
        ResponseTemplate.error("Unauthorized to update this task"),
        403
      );
    }

    const updated = await db.task.update({
      where: { id },
      data: {
        isCompleted: !task.isCompleted,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            service: true,
          },
        },
      },
    });

    return c.json(
      ResponseTemplate.success(
        `Task marked as ${updated.isCompleted ? "completed" : "incomplete"}`,
        updated
      ),
      200
    );
  } catch (err) {
    console.error("Error toggling task status:", err);
    return c.json(ResponseTemplate.error("Failed to update task status"), 500);
  }
});

// Delete a task
taskApp.delete("/delete/:id", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");

  try {
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task) {
      return c.json(ResponseTemplate.error("Task not found"), 404);
    }

    // Check if user has permission to delete this task
    if (
      task.userId !== user.id &&
      user.role !== Role.ADMIN &&
      user.role !== Role.CHEF_SERVICE
    ) {
      return c.json(
        ResponseTemplate.error("Unauthorized to delete this task"),
        403
      );
    }

    await db.task.delete({ where: { id } });

    return c.json(ResponseTemplate.success("Task deleted successfully"), 200);
  } catch (err) {
    console.error("Error deleting task:", err);
    return c.json(ResponseTemplate.error("Failed to delete task"), 500);
  }
});

export default taskApp;
