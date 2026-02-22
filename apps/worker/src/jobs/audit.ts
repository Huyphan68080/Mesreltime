import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { createLogger } from "@mesreltime/shared-logger";

const logger = createLogger("worker-audit");

const redis = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port || 6379)
};

export const createAuditWorker = () => {
  return new Worker(
    "audit-log",
    async (job) => {
      logger.info({ jobId: job.id, data: job.data }, "Persisting audit event");
    },
    {
      connection: redis,
      concurrency: Math.max(2, Math.floor(env.WORKER_CONCURRENCY / 3))
    }
  );
};
