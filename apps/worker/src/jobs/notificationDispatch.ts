import { Queue, Worker } from "bullmq";
import { env } from "../config/env.js";
import { createLogger } from "@mesreltime/shared-logger";

const logger = createLogger("worker-notification");

const redis = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port || 6379)
};

const dlq = new Queue(env.DLQ_NAME, { connection: redis });

export const createNotificationWorker = () => {
  return new Worker(
    "notification-dispatch",
    async (job) => {
      const payload = job.data as {
        notificationId: string;
        userId: string;
        type: string;
        payload: Record<string, unknown>;
      };

      // Placeholder for APNs/FCM/email transport.
      logger.info({ jobId: job.id, payload }, "Dispatching notification");
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

      logger.error({ err: error, jobId: job.id, attemptsMade: job.attemptsMade }, "Notification job failed");

      if (job.attemptsMade >= (job.opts.attempts ?? 0)) {
        await dlq.add("notification-dispatch", { ...job.data, reason: error.message }, {
          jobId: `dlq:${job.id}`
        });
      }
    })
    .on("completed", (job) => {
      logger.info({ jobId: job.id }, "Notification job completed");
    });
};
