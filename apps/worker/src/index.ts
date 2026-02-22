import { createLogger } from "@mesreltime/shared-logger";
import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createAuditWorker } from "./jobs/audit.js";
import { createMediaProcessingWorker } from "./jobs/mediaProcessing.js";
import { createMessageDeliveryWorker } from "./jobs/messageDelivery.js";
import { createNotificationWorker } from "./jobs/notificationDispatch.js";

const logger = createLogger("worker");

const start = async (): Promise<void> => {
  const workers = [
    createMessageDeliveryWorker(),
    createNotificationWorker(),
    createMediaProcessingWorker(),
    createAuditWorker()
  ];

  const healthServer = createServer((req, res) => {
    if (req.url === "/healthz" || req.url === "/readyz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "worker" }));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "not_found" }));
  });

  healthServer.listen(env.WORKER_PORT, "0.0.0.0");

  logger.info({ count: workers.length, workerPort: env.WORKER_PORT }, "Workers started");

  process.on("SIGTERM", async () => {
    await new Promise<void>((resolve, reject) => {
      healthServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    await Promise.all(workers.map((worker) => worker.close()));
    process.exit(0);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});