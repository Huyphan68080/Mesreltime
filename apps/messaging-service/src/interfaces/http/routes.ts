import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { verifyAccessToken } from "@mesreltime/shared-auth";
import { MessagingService } from "../../application/services/MessagingService.js";
import { env } from "../../config/env.js";
import { ConversationRepository } from "../../infrastructure/repositories/ConversationRepository.js";
import { MessageRepository } from "../../infrastructure/repositories/MessageRepository.js";

const createConversationSchema = z.object({
  type: z.enum(["dm", "group"]),
  title: z.string().trim().min(1).max(128).optional(),
  memberIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1)
});

const createMessageSchema = z.object({
  conversationId: z.string().regex(/^[a-f\d]{24}$/i),
  clientMessageId: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
  parentMessageId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  attachments: z.array(
    z.object({
      key: z.string(),
      url: z.string().url(),
      mimeType: z.string(),
      size: z.number().int().nonnegative()
    })
  ).default([])
});

const reactionSchema = z.object({
  emoji: z.string().min(1).max(16)
});

const editMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000)
});

const parseAuthUser = (authHeader: string | undefined): string => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
  return String(payload.sub);
};

export const registerMessagingHttpRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const conversations = new ConversationRepository();
  const messages = new MessageRepository();
  const service = new MessagingService(conversations, messages);

  fastify.get("/conversations", async (request) => {
    const userId = parseAuthUser(request.headers.authorization);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30), cursor: z.string().optional() }).parse(request.query);
    const cursorDate = query.cursor ? new Date(query.cursor) : undefined;

    return conversations.listForUser(userId, query.limit, cursorDate);
  });

  fastify.post("/conversations", async (request, reply) => {
    const userId = parseAuthUser(request.headers.authorization);
    const input = createConversationSchema.parse(request.body);

    if (input.type === "dm") {
      const created = await conversations.createDm({ userA: userId, userB: input.memberIds[0] });
      return reply.code(201).send(created);
    }

    const created = await conversations.createGroup({
      ownerId: userId,
      title: input.title ?? "Untitled",
      memberIds: input.memberIds
    });

    return reply.code(201).send(created);
  });

  fastify.get("/conversations/:id/messages", async (request) => {
    const userId = parseAuthUser(request.headers.authorization);
    const params = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).parse(request.params);
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(50),
      beforeId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
      beforeCreatedAt: z.string().datetime().optional()
    }).parse(request.query);

    return service.listMessages(userId, {
      conversationId: params.id,
      limit: query.limit,
      beforeId: query.beforeId,
      beforeCreatedAt: query.beforeCreatedAt ? new Date(query.beforeCreatedAt) : undefined
    });
  });

  fastify.post("/conversations/:id/messages", async (request, reply) => {
    const userId = parseAuthUser(request.headers.authorization);
    const params = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).parse(request.params);
    const body = createMessageSchema.parse(request.body);

    const created = await service.createMessageIdempotent(userId, {
      ...body,
      conversationId: params.id
    });

    reply.code(201).send(created);
  });

  fastify.patch("/messages/:id", async (request) => {
    const userId = parseAuthUser(request.headers.authorization);
    const params = z.object({ id: z.string().regex(/^[a-f\\d]{24}$/i) }).parse(request.params);
    const body = editMessageSchema.parse(request.body);
    const content = body.content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();

    if (!content) {
      throw new Error("Message content is empty after sanitization");
    }

    return messages.editMessage({ messageId: params.id, senderId: userId, content });
  });

  fastify.delete("/messages/:id", async (request, reply) => {
    const userId = parseAuthUser(request.headers.authorization);
    const params = z.object({ id: z.string().regex(/^[a-f\\d]{24}$/i) }).parse(request.params);
    await messages.deleteMessage({ messageId: params.id, senderId: userId });
    reply.code(204).send();
  });

  fastify.post("/messages/:id/read", async (request, reply) => {
    const userId = parseAuthUser(request.headers.authorization);
    const params = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).parse(request.params);
    await messages.markRead({ messageId: params.id, userId });
    reply.code(204).send();
  });

  fastify.post("/messages/:id/reactions", async (request, reply) => {
    const userId = parseAuthUser(request.headers.authorization);
    const params = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).parse(request.params);
    const body = reactionSchema.parse(request.body);
    await messages.addReaction({ messageId: params.id, userId, emoji: body.emoji });
    reply.code(201).send({ ok: true });
  });

  fastify.delete("/messages/:id/reactions/:emoji", async (request, reply) => {
    const userId = parseAuthUser(request.headers.authorization);
    const params = z.object({
      id: z.string().regex(/^[a-f\d]{24}$/i),
      emoji: z.string().min(1).max(16)
    }).parse(request.params);
    await messages.removeReaction({ messageId: params.id, userId, emoji: params.emoji });
    reply.code(204).send();
  });

  fastify.get("/search/messages", async (request) => {
    const userId = parseAuthUser(request.headers.authorization);
    const query = z.object({ q: z.string().min(2).max(120), conversationIds: z.string(), limit: z.coerce.number().int().min(1).max(50).default(20) }).parse(request.query);
    const ids = query.conversationIds.split(",").filter(Boolean);
    await Promise.all(ids.map((id) => conversations.ensureMember(userId, id)));
    return messages.searchMessages(query.q, ids, query.limit);
  });
};
