import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import auth_controller from "@/routes/auth/auth_controller";
import { cors } from "hono/cors";

const app = new Hono()
  .basePath("/api/v1")
  .use("*", cors())
  .use("*", prettyJSON())
  .use("*", secureHeaders())
  .use("*", timing())
  .route("/auth", auth_controller);

export type AppType = typeof app;

export default app;
