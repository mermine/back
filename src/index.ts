import { serve } from "@hono/node-server";
import app from "@/app";
import { env } from "@/dotenv_config";
import { showRoutes } from "hono/dev";
import { seedUsers } from "./seeds/seed_users";
import { seedLeaveTypes } from "./seeds/seed_leave_types";

const port = Number(env.PORT);
console.log(`Server is running on http://localhost:${port}`);

const init = async () => {
  await seedUsers();
  await seedLeaveTypes();
  console.log("✅ Seeding completed.");
};

init();

serve({
  fetch: app.fetch,
  port,
});

showRoutes(app);

export default {
  fetch: app.fetch,
};
