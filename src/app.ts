import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import authController from "@/routes/auth/auth_controller";
import userController from "@/routes/auth/user_controller";
import childController from "@/routes/children/children_controller";
import { cors } from "hono/cors";
import leave_request from "@/routes/leave_request/leave_request_controller";
import leaveType from "@/routes/leave_type/leave_type_controller";
import leaveBalance from "@/routes/leave_balance/leave_balance_controller";
// import schedule from "@/routes/shedule/shedule_controller";
// import task from "@/routes/task/task_controller";
const app = new Hono()
  .basePath("/api/v1")
  .use("*", cors())
  .use("*", prettyJSON())
  .use("*", secureHeaders())
  .use("*", timing())
  .route("/auth", authController)
  .route("/user", userController)
  .route("/child", childController)
  .route("/leave-request", leave_request)
  .route("/leave-type", leaveType)
  .route("/leave-balance", leaveBalance);
// .route("/schedule", schedule)
// .route("/task", task);
export type AppType = typeof app;

export default app;
