import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { Redis } from "ioredis";
import { env } from "../config/env.js";

export const rateLimitPlugin = fp(async (fastify) => {
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 });

  fastify.addHook("onClose", async () => {
    await redis.quit();
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    redis,
    keyGenerator: (request) => {
      return request.auth?.userId ?? request.ip;
    },
    errorResponseBuilder: () => ({
      code: 429,
      error: "Too Many Requests",
      message: "Rate limit exceeded"
    })
  });
});