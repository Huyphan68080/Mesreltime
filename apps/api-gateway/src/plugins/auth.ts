import fp from "fastify-plugin";
import type { FastifyRequest } from "fastify";
import { verifyAccessToken } from "@mesreltime/shared-auth";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      userId: string;
      sessionId: string;
      roles: string[];
    };
  }
}

const extractBearer = (req: FastifyRequest): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7);
};

export const authPlugin = fp(async (fastify) => {
  fastify.decorate("requireAuth", async (request: FastifyRequest) => {
    const token = extractBearer(request) ?? request.cookies.accessToken;

    if (!token) {
      throw fastify.httpErrors.unauthorized("Missing access token");
    }

    const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);

    request.auth = {
      userId: String(payload.sub),
      sessionId: String(payload.sid),
      roles: (payload.roles as string[]) ?? []
    };
  });

  fastify.decorate("requireRole", async (request: FastifyRequest, allowedRoles: string[]) => {
    await fastify.requireAuth(request);
    const hasRole = request.auth?.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      throw fastify.httpErrors.forbidden("Missing required role");
    }
  });
});

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest) => Promise<void>;
    requireRole: (request: FastifyRequest, allowedRoles: string[]) => Promise<void>;
  }
}
