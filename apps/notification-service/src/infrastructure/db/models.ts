import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    state: {
      type: String,
      enum: ["pending", "sent", "read"],
      default: "pending",
      index: true
    },
    batchedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ userId: 1, state: 1, createdAt: -1 });

export const NotificationModel = model("notifications", notificationSchema);
