import { z } from "zod";
import { loadEnv } from "@mesreltime/shared-config";

const schema = z.object({
  WORKER_PORT: z.coerce.number().int().positive().default(4010),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).default(25),
  DLQ_NAME: z.string().default("dead-letter")
});

export const env = {
  ...loadEnv(process.env),
  ...schema.parse(process.env)
};
