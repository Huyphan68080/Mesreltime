import Fastify from "fastify";
import cors from "@fastify/cors";
import { createLogger } from "@mesreltime/shared-logger";
import { env } from "./config/env.js";
import { connectMongo } from "./infrastructure/db/mongo.js";
import { registerNotificationRoutes } from "./interfaces/http/routes.js";

const bootstrap = async (): Promise<void> => {
  const logger = createLogger("notification-service");
  const app = Fastify({ logger });

  await app.register(cors, { origin: true, credentials: true });
  await connectMongo();

  app.get("/healthz", async () => ({ status: "ok", service: "notification-service" }));
  app.get("/readyz", async () => ({ status: "ready", service: "notification-service" }));

  await app.register(async (instance) => {
    await registerNotificationRoutes(instance);
  }, { prefix: "/v1/notifications" });

  await app.listen({ host: "0.0.0.0", port: env.PORT });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});