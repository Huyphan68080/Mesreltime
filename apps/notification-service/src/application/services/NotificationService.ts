import { Queue } from "bullmq";
import { Types } from "mongoose";
import { env } from "../../config/env.js";
import { NotificationModel } from "../../infrastructure/db/models.js";

export interface NotificationInput {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
}

const parseRedis = () => {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379)
  };
};

const queue = new Queue("notification-dispatch", {
  connection: parseRedis(),
  defaultJobOptions: {
    attempts: 8,
    backoff: {
      type: "exponential",
      delay: 1000
    },
    removeOnComplete: 10000,
    removeOnFail: 20000
  }
});

export class NotificationService {
  async create(input: NotificationInput) {
    const doc = await NotificationModel.create({
      userId: new Types.ObjectId(input.userId),
      type: input.type,
      payload: input.payload,
      state: "pending"
    });

    const delay = env.BATCH_WINDOW_SECONDS * 1000;

    await queue.add(
      "dispatch",
      {
        notificationId: String(doc._id),
        userId: input.userId,
        type: input.type,
        payload: input.payload
      },
      {
        delay,
        jobId: `notif:${String(doc._id)}`
      }
    );

    return doc;
  }

  async listForUser(userId: string, limit: number) {
    return NotificationModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async markRead(notificationId: string, userId: string) {
    await NotificationModel.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId)
      },
      {
        $set: {
          state: "read"
        }
      }
    );
  }
}
