import { z } from "zod";
import { loadEnv } from "@mesreltime/shared-config";

const schema = z.object({
  PORT: z.coerce.number().default(4001),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d")
});

export const env = {
  ...loadEnv(process.env),
  ...schema.parse(process.env)
};
