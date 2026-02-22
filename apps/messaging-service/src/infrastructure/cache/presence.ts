import { createRedisClient, presenceKey } from "@mesreltime/shared-cache";
import { env } from "../../config/env.js";

const redis = createRedisClient(env.REDIS_URL);

export const setOnline = async (userId: string): Promise<void> => {
  await redis.set(presenceKey(userId), "online", "EX", 60);
};

export const setOffline = async (userId: string): Promise<void> => {
  await redis.del(presenceKey(userId));
};

export const isOnline = async (userId: string): Promise<boolean> => {
  const value = await redis.get(presenceKey(userId));
  return value === "online";
};

export const getPresenceRedis = () => redis;
