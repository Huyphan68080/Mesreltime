import { z } from "zod";
import { loadEnv } from "@mesreltime/shared-config";

const gatewaySchema = z.object({
  PORT: z.coerce.number().default(4000),
  AUTH_SERVICE_URL: z.string().default("http://localhost:4001"),
  MESSAGING_SERVICE_URL: z.string().default("http://localhost:4002"),
  NOTIFICATION_SERVICE_URL: z.string().default("http://localhost:4003"),
  MEDIA_SERVICE_URL: z.string().default("http://localhost:4004")
});

export const env = {
  ...loadEnv(process.env),
  ...gatewaySchema.parse(process.env)
};
