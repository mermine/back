import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/prisma_client";
import {
  createLeaveBalanceSchema,
  updateLeaveBalanceSchema,
} from "./schema/index";
import { differenceInDays } from "date-fns";
import { authMiddleware } from "@/middlewares/auth_middleware";
import { roleMiddleware } from "@/middlewares/role_middleware";
import { Role } from "@prisma/client";
import { ResponseTemplate } from "@/constants";

const leaveBalanceApp = new Hono()
  .use("*", authMiddleware)
  .post(
    "/create",
    roleMiddleware([Role.ADMIN]),
    zValidator("json", createLeaveBalanceSchema),
    async (c) => {
      const data = c.req.valid("json");
      try {
        // Check if leave balance already exists for this user, year, and leave type
        const existing = await db.leaveBalance.findUnique({
          where: {
            userId_year_typeCongeId: {
              userId: data.userId,
              year: data.year,
              typeCongeId: data.typeCongeId,
            },
          },
        });

        if (existing) {
          return c.json(
            ResponseTemplate.error(
              "Leave balance already exists for this user, year, and leave type"
            ),
            400
          );
        }

        const leaveBalance = await db.leaveBalance.create({
          data,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            typeConge: true,
          },
        });

        return c.json(
          ResponseTemplate.success("Leave balance created", leaveBalance),
          201
        );
      } catch (err) {
        console.error("Error creating leave balance:", err);
        return c.json(
          ResponseTemplate.error("Failed to create leave balance"),
          500
        );
      }
    }
  )
  .put(
    "/update/:id",
    roleMiddleware([Role.ADMIN]),
    zValidator("json", updateLeaveBalanceSchema),
    async (c) => {
      const { id } = c.req.param();
      const data = c.req.valid("json");
      try {
        const updated = await db.leaveBalance.update({
          where: { id },
          data,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            typeConge: true,
          },
        });

        return c.json(
          ResponseTemplate.success("Leave balance updated", updated),
          200
        );
      } catch (err) {
        console.error("Update error:", err);
        return c.json(
          ResponseTemplate.error("Leave balance not found or update failed"),
          404
        );
      }
    }
  )
  .put("/update-on-leave/:userId", async (c) => {
    const { userId } = c.req.param();
    const body = await c.req.json();
    const { startDate, endDate, typeCongeId } = body;

    try {
      const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1; // +1 to include both start and end date

      // Find the leave balance for the specific user, year, and leave type
      const leaveBalance = await db.leaveBalance.findUnique({
        where: {
          userId_year_typeCongeId: {
            userId,
            year: new Date(startDate).getFullYear(),
            typeCongeId,
          },
        },
      });

      if (!leaveBalance) {
        return c.json(
          ResponseTemplate.error(
            "Leave balance not found for this user and leave type"
          ),
          404
        );
      }

      // Check if user has enough remaining balance
      if (leaveBalance.remainingBalance < days) {
        return c.json(
          ResponseTemplate.error("Insufficient leave balance"),
          400
        );
      }

      const updated = await db.leaveBalance.update({
        where: {
          userId_year_typeCongeId: {
            userId,
            year: new Date(startDate).getFullYear(),
            typeCongeId,
          },
        },
        data: {
          usedBalance: { increment: days },
          remainingBalance: { decrement: days },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          typeConge: true,
        },
      });

      return c.json(
        ResponseTemplate.success(
          "Leave balance updated based on leave",
          updated
        ),
        200
      );
    } catch (err) {
      console.error("Error updating leave balance on leave:", err);
      return c.json(
        ResponseTemplate.error("Failed to update leave balance based on leave"),
        500
      );
    }
  })
  .get("/all", roleMiddleware([Role.ADMIN]), async (c) => {
    try {
      const balances = await db.leaveBalance.findMany({
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
          typeConge: true,
        },
        orderBy: [{ year: "desc" }, { user: { name: "asc" } }],
      });

      return c.json(
        ResponseTemplate.success("Leave balances fetched", balances),
        200
      );
    } catch (err) {
      return c.json(
        ResponseTemplate.error("Failed to fetch leave balances"),
        500
      );
    }
  })
  .get("/user/:userId?", async (c) => {
    const user = c.get("user");
    const { userId } = c.req.param();

    // If userId is provided, check if user has permission to view other's balances
    const targetUserId = userId || user.id;

    if (userId && userId !== user.id && user.role !== Role.ADMIN) {
      return c.json(
        ResponseTemplate.error(
          "Unauthorized to view other user's leave balance"
        ),
        403
      );
    }

    try {
      const currentYear = new Date().getFullYear();
      const balances = await db.leaveBalance.findMany({
        where: {
          userId: targetUserId,
          year: currentYear,
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
          typeConge: true,
        },
        orderBy: {
          typeConge: { name: "asc" },
        },
      });

      return c.json(
        ResponseTemplate.success("User leave balances fetched", balances),
        200
      );
    } catch (err) {
      return c.json(
        ResponseTemplate.error("Failed to fetch user leave balances"),
        500
      );
    }
  })
  .get("/show/:id", async (c) => {
    const { id } = c.req.param();
    const user = c.get("user");

    try {
      const balance = await db.leaveBalance.findUnique({
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
          typeConge: true,
        },
      });

      if (!balance) {
        return c.json(ResponseTemplate.error("Leave balance not found"), 404);
      }

      // Check if user has permission to view this balance
      if (balance.userId !== user.id && user.role !== Role.ADMIN) {
        return c.json(
          ResponseTemplate.error("Unauthorized to view this leave balance"),
          403
        );
      }

      return c.json(
        ResponseTemplate.success("Leave balance found", balance),
        200
      );
    } catch (err) {
      return c.json(
        ResponseTemplate.error("Failed to fetch leave balance"),
        500
      );
    }
  })
  .delete("/delete/:id", roleMiddleware([Role.ADMIN]), async (c) => {
    const { id } = c.req.param();
    try {
      await db.leaveBalance.delete({ where: { id } });
      return c.json(ResponseTemplate.success("Leave balance deleted"), 200);
    } catch (err) {
      return c.json(ResponseTemplate.error("Delete failed"), 500);
    }
  });

export default leaveBalanceApp;
