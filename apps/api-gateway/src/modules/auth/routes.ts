import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { proxyRequest } from "../../lib/proxy.js";
import { env } from "../../config/env.js";

export const registerAuthRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const handler = async (req: FastifyRequest, reply: FastifyReply) => {
    const path = req.url.replace(/^\/v1\/auth/, "");
    await proxyRequest(req, reply, env.AUTH_SERVICE_URL, path);
  };

  fastify.all("/v1/auth", handler);
  fastify.all("/v1/auth/*", handler);
};