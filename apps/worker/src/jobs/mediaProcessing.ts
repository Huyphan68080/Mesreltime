import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { createLogger } from "@mesreltime/shared-logger";

const logger = createLogger("worker-media");

const redis = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port || 6379)
};

export const createMediaProcessingWorker = () => {
  return new Worker(
    "media-processing",
    async (job) => {
      // Placeholder for virus scan, thumbnail generation, metadata extraction.
      logger.info({ jobId: job.id, data: job.data }, "Processing media job");
    },
    {
      connection: redis,
      concurrency: Math.max(2, Math.floor(env.WORKER_CONCURRENCY / 2))
    }
  );
};
