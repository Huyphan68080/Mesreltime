import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { verifyAccessToken } from "@mesreltime/shared-auth";
import { createLogger } from "@mesreltime/shared-logger";
import { typingSchema } from "@mesreltime/shared-zod";
import { env } from "../../config/env.js";
import { setOffline, setOnline, getPresenceRedis } from "../../infrastructure/cache/presence.js";
import { MessagingService } from "../../application/services/MessagingService.js";
import { ConversationRepository } from "../../infrastructure/repositories/ConversationRepository.js";
import { MessageRepository } from "../../infrastructure/repositories/MessageRepository.js";
import { enqueueDeliveryRetry } from "../../infrastructure/queue/deliveryQueue.js";
import { registerMessagingHttpRoutes } from "../http/routes.js";

export interface SocketContext {
  userId: string;
  roles: string[];
}

const parseToken = (token: string): SocketContext => {
  const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
  return {
    userId: String(payload.sub),
    roles: (payload.roles as string[]) ?? []
  };
};

export const createRealtimeServer = async () => {
  const logger = createLogger("messaging-service");
  const app = Fastify({ logger });
  const runtimeMetrics = {
    activeSockets: 0,
    messagesSent: 0,
    messageAcks: 0
  };
  await app.register(cors, { origin: true, credentials: true });

  await app.register(async (instance) => {
    await registerMessagingHttpRoutes(instance);
  }, { prefix: "/v1" });

  app.get("/healthz", async () => ({ status: "ok", service: "messaging-service" }));
  app.get("/readyz", async () => ({ status: "ready", service: "messaging-service" }));
  app.get("/metrics", async () => ({
    service: "messaging-service",
    activeSockets: runtimeMetrics.activeSockets,
    messagesSent: runtimeMetrics.messagesSent,
    messageAcks: runtimeMetrics.messageAcks
  }));

  const io = new Server(app.server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  const pubClient = createClient({ url: env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await pubClient.connect();
  await subClient.connect();
  io.adapter(createAdapter(pubClient, subClient));

  const messageService = new MessagingService(new ConversationRepository(), new MessageRepository());

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth.token as string | undefined) ??
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const context = parseToken(token);
      socket.data.user = context;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const context = socket.data.user as SocketContext;
    runtimeMetrics.activeSockets += 1;

    void setOnline(context.userId);

    socket.on("room.join", async (payload: { conversationId: string }, ack?: (res: unknown) => void) => {
      try {
        await new ConversationRepository().ensureMember(context.userId, payload.conversationId);
        await socket.join(`conv:${payload.conversationId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: "Forbidden" });
      }
    });

    socket.on("room.leave", async (payload: { conversationId: string }) => {
      await socket.leave(`conv:${payload.conversationId}`);
    });

    socket.on("presence.ping", async () => {
      await setOnline(context.userId);
      socket.emit("presence.updated", { userId: context.userId, online: true });
    });

    socket.on("typing.start", async (payload, ack?: (res: unknown) => void) => {
      try {
        const data = typingSchema.parse({ ...payload, isTyping: true });
        await new ConversationRepository().ensureMember(context.userId, data.conversationId);
        socket.to(`conv:${data.conversationId}`).emit("typing.updated", {
          conversationId: data.conversationId,
          userId: context.userId,
          isTyping: true
        });
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    socket.on("typing.stop", async (payload, ack?: (res: unknown) => void) => {
      try {
        const data = typingSchema.parse({ ...payload, isTyping: false });
        await new ConversationRepository().ensureMember(context.userId, data.conversationId);
        socket.to(`conv:${data.conversationId}`).emit("typing.updated", {
          conversationId: data.conversationId,
          userId: context.userId,
          isTyping: false
        });
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    socket.on("message.send", async (payload, ack?: (res: unknown) => void) => {
      try {
        const created = await messageService.createMessageIdempotent(context.userId, payload);
        runtimeMetrics.messagesSent += 1;
        const room = `conv:${String(created.conversationId)}`;
        io.to(room).emit("message.new", created);

        ack?.({
          ok: true,
          messageId: String(created._id),
          createdAt: created.createdAt
        });
      } catch {
        ack?.({ ok: false, error: "MESSAGE_SEND_FAILED" });
      }
    });

    socket.on("message.ack", async (payload: { messageId: string; conversationId: string }) => {
      runtimeMetrics.messageAcks += 1;
      io.to(`conv:${payload.conversationId}`).emit("message.delivery", {
        messageId: payload.messageId,
        userId: context.userId,
        deliveredAt: new Date().toISOString()
      });
    });

    socket.on("message.retry", async (payload: { conversationId: string; messageId: string; targetUserId: string }) => {
      await enqueueDeliveryRetry({
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        targetUserId: payload.targetUserId,
        attempt: 1
      });
    });

    socket.on("receipt.read", async (payload: { messageId: string; conversationId: string }) => {
      const repo = new MessageRepository();
      await repo.markRead({ messageId: payload.messageId, userId: context.userId });
      io.to(`conv:${payload.conversationId}`).emit("receipt.updated", {
        messageId: payload.messageId,
        userId: context.userId,
        readAt: new Date().toISOString()
      });
    });

    socket.on("reaction.add", async (payload: { messageId: string; conversationId: string; emoji: string }) => {
      const repo = new MessageRepository();
      await repo.addReaction({ messageId: payload.messageId, userId: context.userId, emoji: payload.emoji });
      io.to(`conv:${payload.conversationId}`).emit("reaction.updated", {
        type: "add",
        ...payload,
        userId: context.userId
      });
    });

    socket.on("reaction.remove", async (payload: { messageId: string; conversationId: string; emoji: string }) => {
      const repo = new MessageRepository();
      await repo.removeReaction({ messageId: payload.messageId, userId: context.userId, emoji: payload.emoji });
      io.to(`conv:${payload.conversationId}`).emit("reaction.updated", {
        type: "remove",
        ...payload,
        userId: context.userId
      });
    });

    socket.on("call.offer", async (payload: { conversationId: string; sdp: string }) => {
      await new ConversationRepository().ensureMember(context.userId, payload.conversationId);
      io.to(`conv:${payload.conversationId}`).emit("call.offer", {
        conversationId: payload.conversationId,
        sdp: payload.sdp,
        fromUserId: context.userId
      });
    });

    socket.on("call.answer", async (payload: { conversationId: string; sdp: string }) => {
      await new ConversationRepository().ensureMember(context.userId, payload.conversationId);
      io.to(`conv:${payload.conversationId}`).emit("call.answer", {
        conversationId: payload.conversationId,
        sdp: payload.sdp,
        fromUserId: context.userId
      });
    });

    socket.on("call.ice", async (payload: { conversationId: string; candidate: unknown }) => {
      await new ConversationRepository().ensureMember(context.userId, payload.conversationId);
      io.to(`conv:${payload.conversationId}`).emit("call.ice", {
        conversationId: payload.conversationId,
        candidate: payload.candidate,
        fromUserId: context.userId
      });
    });

    socket.on("call.hangup", async (payload: { conversationId: string }) => {
      await new ConversationRepository().ensureMember(context.userId, payload.conversationId);
      io.to(`conv:${payload.conversationId}`).emit("call.hangup", {
        conversationId: payload.conversationId,
        fromUserId: context.userId
      });
    });

    socket.on("disconnect", async () => {
      runtimeMetrics.activeSockets = Math.max(0, runtimeMetrics.activeSockets - 1);
      await setOffline(context.userId);
    });
  });

  app.addHook("onClose", async () => {
    await pubClient.quit();
    await subClient.quit();
    await getPresenceRedis().quit();
  });

  return {
    app,
    io
  };
};
