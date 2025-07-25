import { Role } from "@prisma/client";
import { MiddlewareHandler } from "hono";

// Middleware to verify if the user has the required role
export const roleMiddleware = (allowedRoles: Role[]): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get("user"); // Get the user from the auth middleware

    // Check if the user's role is allowed
    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: "You are not authorized to perform this action.",
        },
        403 // Forbidden
      );
    }

    // If the user's role is allowed, proceed to the next middleware/route
    await next();
  };
};
