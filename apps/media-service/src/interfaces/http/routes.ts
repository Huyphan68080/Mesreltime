import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { verifyAccessToken } from "@mesreltime/shared-auth";
import { env } from "../../config/env.js";
import { MediaService } from "../../application/services/MediaService.js";

const parseAuth = (header: string | undefined): string => {
  if (!header || !header.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = header.slice(7);
  const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
  return String(payload.sub);
};

export const registerMediaRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const service = new MediaService();

  fastify.post("/upload-url", async (request, reply) => {
    const userId = parseAuth(request.headers.authorization);
    const body = z.object({
      fileName: z.string().min(1).max(256),
      contentType: z.string().min(1).max(128)
    }).parse(request.body);

    const result = await service.requestUpload({
      userId,
      fileName: body.fileName,
      contentType: body.contentType
    });

    reply.code(201).send(result);
  });

  fastify.post("/complete", async (request, reply) => {
    const userId = parseAuth(request.headers.authorization);
    const body = z.object({
      key: z.string().min(1),
      size: z.number().int().nonnegative(),
      mimeType: z.string().min(1)
    }).parse(request.body);

    await service.completeUpload({
      userId,
      key: body.key,
      size: body.size,
      mimeType: body.mimeType
    });

    reply.code(204).send();
  });
};
