import Fastify from "fastify";
import cors from "@fastify/cors";
import { createLogger } from "@mesreltime/shared-logger";
import { env } from "./config/env.js";
import { connectMongo } from "./infrastructure/db/mongo.js";
import { registerMediaRoutes } from "./interfaces/http/routes.js";

const bootstrap = async (): Promise<void> => {
  const logger = createLogger("media-service");
  const app = Fastify({ logger });

  await app.register(cors, { origin: true, credentials: true });
  await connectMongo();

  app.get("/healthz", async () => ({ status: "ok", service: "media-service" }));
  app.get("/readyz", async () => ({ status: "ready", service: "media-service" }));

  await app.register(async (instance) => {
    await registerMediaRoutes(instance);
  }, { prefix: "/v1/media" });

  await app.listen({ host: "0.0.0.0", port: env.PORT });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});