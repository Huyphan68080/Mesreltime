import { z } from "zod";
import { loadEnv } from "@mesreltime/shared-config";

const schema = z.object({
  PORT: z.coerce.number().default(4002),
  CORS_ORIGIN: z.string().default("http://localhost:3000")
});

export const env = {
  ...loadEnv(process.env),
  ...schema.parse(process.env)
};
