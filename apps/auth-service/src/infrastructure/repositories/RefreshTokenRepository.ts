import { RefreshTokenModel } from "../db/models.js";

export class RefreshTokenRepository {
  async upsert(input: {
    userId: string;
    sessionId: string;
    tokenHash: string;
    deviceId: string;
    expiresAt: Date;
  }) {
    await RefreshTokenModel.updateOne(
      { userId: input.userId, sessionId: input.sessionId },
      {
        $set: {
          tokenHash: input.tokenHash,
          deviceId: input.deviceId,
          expiresAt: input.expiresAt,
          revokedAt: null
        }
      },
      { upsert: true }
    );
  }

  async findActiveBySession(userId: string, sessionId: string) {
    return RefreshTokenModel.findOne({
      userId,
      sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).lean();
  }

  async revokeSession(userId: string, sessionId: string) {
    await RefreshTokenModel.updateOne(
      { userId, sessionId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
}
