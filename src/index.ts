import { serve } from "@hono/node-server";
import app from "@/app";
import { env } from "@/dotenv_config";
import { showRoutes } from "hono/dev";

const port = Number(env.PORT);
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

showRoutes(app);

export default {
  fetch: app.fetch,
};
