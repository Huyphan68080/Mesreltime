import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { proxyRequest } from "../../lib/proxy.js";
import { env } from "../../config/env.js";

export const registerNotificationRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.addHook("preHandler", async (req) => {
    if (req.url.startsWith("/v1/notifications")) {
      await fastify.requireAuth(req);
    }
  });

  const handler = async (req: FastifyRequest, reply: FastifyReply) => {
    const path = req.url.replace(/^\/v1/, "");
    await proxyRequest(req, reply, env.NOTIFICATION_SERVICE_URL, path);
  };

  fastify.all("/v1/notifications", handler);
  fastify.all("/v1/notifications/*", handler);
};