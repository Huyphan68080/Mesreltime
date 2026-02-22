import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ["member"] },
    status: { type: String, enum: ["active", "blocked"], default: "active" }
  },
  { timestamps: true, versionKey: false }
);

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    deviceId: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

refreshTokenSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserModel = model("users", userSchema);
export const RefreshTokenModel = model("refresh_tokens", refreshTokenSchema);
