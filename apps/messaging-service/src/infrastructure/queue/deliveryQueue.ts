import { Queue } from "bullmq";
import { env } from "../../config/env.js";

export interface DeliveryJobData {
  conversationId: string;
  messageId: string;
  targetUserId: string;
  attempt: number;
}

export const deliveryQueue = new Queue<DeliveryJobData>("message-delivery", {
  connection: {
    host: new URL(env.REDIS_URL).hostname,
    port: Number(new URL(env.REDIS_URL).port || 6379)
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 300
    },
    removeOnComplete: 5000,
    removeOnFail: 10000
  }
});

export const enqueueDeliveryRetry = async (data: DeliveryJobData): Promise<void> => {
  await deliveryQueue.add("retry", data, {
    jobId: `${data.messageId}:${data.targetUserId}:${Date.now()}`
  });
};
