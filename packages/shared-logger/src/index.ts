import pino from "pino";

export const createLogger = (serviceName: string) => {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL ?? "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ["req.headers.authorization", "password", "token", "accessToken", "refreshToken"],
      censor: "[REDACTED]"
    }
  });
};

export type AppLogger = ReturnType<typeof createLogger>;
