import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { proxyRequest } from "../../lib/proxy.js";
import { env } from "../../config/env.js";

const protectedPrefixes = ["/v1/conversations", "/v1/messages", "/v1/search"];

export const registerMessagingRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.addHook("preHandler", async (req) => {
    if (protectedPrefixes.some((prefix) => req.url.startsWith(prefix))) {
      await fastify.requireAuth(req);
    }
  });

  const proxyMessaging = async (req: FastifyRequest, reply: FastifyReply) => {
    const path = req.url.replace(/^\/v1/, "");
    await proxyRequest(req, reply, env.MESSAGING_SERVICE_URL, path);
  };

  fastify.all("/v1/conversations", proxyMessaging);
  fastify.all("/v1/conversations/*", proxyMessaging);
  fastify.all("/v1/messages", proxyMessaging);
  fastify.all("/v1/messages/*", proxyMessaging);
  fastify.all("/v1/search", proxyMessaging);
  fastify.all("/v1/search/*", proxyMessaging);
};