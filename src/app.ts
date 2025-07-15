import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import auth_controller from "@/routes/auth/auth_controller";
import child_controller from "@/routes/children/children_controller";
import { cors } from "hono/cors";
import leave_request from "@/routes/leave_request/leave_request_controller";
import leaveType from "@/routes/leave_type/leave_type_controller";

const app = new Hono()
  .basePath("/api/v1")
  .use("*", cors())
  .use("*", prettyJSON())
  .use("*", secureHeaders())
  .use("*", timing())
  .route("/auth", auth_controller)
  .route("/child", child_controller)
  .route("/leave-request", leave_request)
  .route("/leave-type", leaveType);

export type AppType = typeof app;

export default app;
