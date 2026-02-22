import { Redis } from "ioredis";

export const createRedisClient = (redisUrl: string): Redis => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
  });
};

export const presenceKey = (userId: string): string => `presence:user:${userId}`;
export const conversationCacheKey = (conversationId: string): string => `conversation:${conversationId}`;