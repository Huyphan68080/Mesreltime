import { z } from "zod";
import { loadEnv } from "@mesreltime/shared-config";

const schema = z.object({
  PORT: z.coerce.number().default(4004),
  UPLOAD_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(600)
});

export const env = {
  ...loadEnv(process.env),
  ...schema.parse(process.env)
};
