import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { createLogger } from "@mesreltime/shared-logger";
import { env } from "./config/env.js";
import { authPlugin } from "./plugins/auth.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";
import { registerAuthRoutes } from "./modules/auth/routes.js";
import { registerMessagingRoutes } from "./modules/messaging/routes.js";
import { registerMediaRoutes } from "./modules/media/routes.js";
import { registerNotificationRoutes } from "./modules/notification/routes.js";

const bootstrap = async (): Promise<void> => {
  const logger = createLogger("api-gateway");
  const app = Fastify({ logger });
  const metrics = {
    requestCount: 0,
    errorCount: 0,
    totalLatencyMs: 0
  };

  await app.register(cors, {
    origin: true,
    credentials: true
  });
  await app.register(sensible);
  await app.register(cookie);
  await app.register(authPlugin);
  await app.register(rateLimitPlugin);

  app.addHook("preHandler", async (request) => {
    const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
    const hasCookieAuth = Boolean(request.cookies.accessToken);

    if (!writeMethods.has(request.method) || !hasCookieAuth) {
      return;
    }

    const csrfCookie = request.cookies.csrfToken;
    const csrfHeader = request.headers["x-csrf-token"];
    const csrfValue = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;

    if (!csrfCookie || !csrfValue || csrfCookie !== csrfValue) {
      throw app.httpErrors.forbidden("Invalid CSRF token");
    }
  });

  app.addHook("onRequest", async (request) => {
    (request as any).__startAt = performance.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const start = (request as any).__startAt ?? performance.now();
    const latency = performance.now() - start;
    metrics.requestCount += 1;
    metrics.totalLatencyMs += latency;

    if (reply.statusCode >= 500) {
      metrics.errorCount += 1;
    }
  });

  app.get("/healthz", async () => ({ status: "ok", service: "api-gateway" }));
  app.get("/readyz", async () => ({ status: "ready", service: "api-gateway" }));
  app.get("/metrics", async () => ({
    service: "api-gateway",
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    avgLatencyMs: metrics.requestCount === 0 ? 0 : metrics.totalLatencyMs / metrics.requestCount
  }));

  await registerAuthRoutes(app);
  await registerMessagingRoutes(app);
  await registerMediaRoutes(app);
  await registerNotificationRoutes(app);

  await app.listen({
    host: "0.0.0.0",
    port: env.PORT
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
