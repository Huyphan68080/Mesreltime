import { Queue, Worker } from "bullmq";
import { env } from "../config/env.js";
import { createLogger } from "@mesreltime/shared-logger";

const logger = createLogger("worker-message-delivery");

const redis = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port || 6379)
};

const dlq = new Queue(env.DLQ_NAME, { connection: redis });

export const createMessageDeliveryWorker = () => {
  return new Worker(
    "message-delivery",
    async (job) => {
      const payload = job.data as {
        conversationId: string;
        messageId: string;
        targetUserId: string;
      };

      // Placeholder for push/socket fallback dispatch to offline users.
      // In production, this should call a dedicated delivery service or emit through gateway.
      logger.info({ payload, jobId: job.id }, "Processing message delivery retry");
    },
    {
      connection: redis,
      concurrency: env.WORKER_CONCURRENCY
    }
  )
    .on("failed", async (job, error) => {
      if (!job) {
        return;
      }

      logger.error({ err: error, jobId: job.id, attemptsMade: job.attemptsMade }, "Delivery job failed");

      if (job.attemptsMade >= (job.opts.attempts ?? 0)) {
        await dlq.add("message-delivery", { ...job.data, reason: error.message }, {
          jobId: `dlq:${job.id}`
        });
      }
    })
    .on("completed", (job) => {
      logger.info({ jobId: job.id }, "Delivery job completed");
    });
};
