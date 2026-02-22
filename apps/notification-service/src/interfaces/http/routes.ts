import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { verifyAccessToken } from "@mesreltime/shared-auth";
import { env } from "../../config/env.js";
import { NotificationService } from "../../application/services/NotificationService.js";

const parseAuth = (header: string | undefined): string => {
  if (!header || !header.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = header.slice(7);
  const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
  return String(payload.sub);
};

export const registerNotificationRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const service = new NotificationService();

  fastify.post("/", async (request, reply) => {
    const userId = parseAuth(request.headers.authorization);
    const body = z.object({ type: z.string().min(1), payload: z.record(z.unknown()) }).parse(request.body);

    const created = await service.create({
      userId,
      type: body.type,
      payload: body.payload
    });

    reply.code(201).send(created);
  });

  fastify.get("/", async (request) => {
    const userId = parseAuth(request.headers.authorization);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) }).parse(request.query);
    return service.listForUser(userId, query.limit);
  });

  fastify.post("/:id/read", async (request, reply) => {
    const userId = parseAuth(request.headers.authorization);
    const params = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).parse(request.params);
    await service.markRead(params.id, userId);
    reply.code(204).send();
  });
};
