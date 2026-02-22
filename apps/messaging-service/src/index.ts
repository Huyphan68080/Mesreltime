import { connectMongo } from "./infrastructure/db/mongo.js";
import { createRealtimeServer } from "./interfaces/ws/socketServer.js";
import { env } from "./config/env.js";

const bootstrap = async (): Promise<void> => {
  await connectMongo();
  const { app } = await createRealtimeServer();
  await app.listen({ host: "0.0.0.0", port: env.PORT });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});