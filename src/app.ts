import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import auth_controller from "@/routes/auth/auth_controller";
import child_controller from "@/routes/children/children_controller";
import { cors } from "hono/cors";
import demande_controller from "@/routes/demandeConge/demande_controller";
import typeConge_controller from "@/routes/typeConge/type_contoller";
const app = new Hono()
  .basePath("/api/v1")
  .use("*", cors())
  .use("*", prettyJSON())
  .use("*", secureHeaders())
  .use("*", timing())
  .route("/auth", auth_controller)
  .route("/child", child_controller);
  app.route("/demande", demande_controller)
  .route("/typeConge", typeConge_controller);
  
export type AppType = typeof app;
app.get("/", (c) => {
  return c.json({ message: "Welcome to the API" });
});
export default app;
