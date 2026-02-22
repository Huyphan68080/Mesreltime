import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { createLogger } from "@mesreltime/shared-logger";
import { env } from "./config/env.js";
import { connectMongo } from "./infrastructure/db/mongo.js";
import { registerAuthHttpRoutes } from "./interfaces/http/routes.js";

const bootstrap = async (): Promise<void> => {
  const logger = createLogger("auth-service");
  const app = Fastify({ logger });

  await app.register(cors, {
    origin: true,
    credentials: true
  });
  await app.register(cookie);

  await connectMongo();

  app.get("/healthz", async () => ({ status: "ok", service: "auth-service" }));
  app.get("/readyz", async () => ({ status: "ready", service: "auth-service" }));

  await app.register(async (instance) => {
    await registerAuthHttpRoutes(instance);
  }, { prefix: "/v1/auth" });

  await app.listen({ host: "0.0.0.0", port: env.PORT });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
