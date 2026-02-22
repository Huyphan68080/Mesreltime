import { z } from "zod";
import { loadEnv } from "@mesreltime/shared-config";

const schema = z.object({
  PORT: z.coerce.number().default(4003),
  BATCH_WINDOW_SECONDS: z.coerce.number().int().min(1).default(30)
});

export const env = {
  ...loadEnv(process.env),
  ...schema.parse(process.env)
};
