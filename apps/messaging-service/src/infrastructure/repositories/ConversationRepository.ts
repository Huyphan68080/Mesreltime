import { Types } from "mongoose";
import { conversationCacheKey } from "@mesreltime/shared-cache";
import { ConversationMemberModel, ConversationModel } from "../db/models.js";
import { getPresenceRedis } from "../cache/presence.js";

export class ConversationRepository {
  async createGroup(input: { ownerId: string; title: string; memberIds: string[] }) {
    const conversation = await ConversationModel.create({
      type: "group",
      ownerId: new Types.ObjectId(input.ownerId),
      title: input.title,
      memberCount: input.memberIds.length + 1
    });

    const uniqueMembers = Array.from(new Set([input.ownerId, ...input.memberIds]));

    await ConversationMemberModel.insertMany(
      uniqueMembers.map((userId) => ({
        conversationId: conversation._id,
        userId: new Types.ObjectId(userId),
        role: userId === input.ownerId ? "owner" : "member"
      }))
    );

    return conversation;
  }

  async createDm(input: { userA: string; userB: string }) {
    const conversation = await ConversationModel.create({
      type: "dm",
      ownerId: new Types.ObjectId(input.userA),
      memberCount: 2
    });

    await ConversationMemberModel.insertMany([
      {
        conversationId: conversation._id,
        userId: new Types.ObjectId(input.userA),
        role: "owner"
      },
      {
        conversationId: conversation._id,
        userId: new Types.ObjectId(input.userB),
        role: "member"
      }
    ]);

    return conversation;
  }

  async ensureMember(userId: string, conversationId: string) {
    const exists = await ConversationMemberModel.exists({
      userId: new Types.ObjectId(userId),
      conversationId: new Types.ObjectId(conversationId)
    });

    if (!exists) {
      throw new Error("User is not member of conversation");
    }
  }

  async listForUser(userId: string, limit: number, cursorUpdatedAt?: Date) {
    const redis = getPresenceRedis();
    const cursor = cursorUpdatedAt ? cursorUpdatedAt.toISOString() : "first";
    const key = `${conversationCacheKey(`list:${userId}`)}:${limit}:${cursor}`;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const memberFilter: any = { userId: new Types.ObjectId(userId), isArchived: false };

    if (cursorUpdatedAt) {
      memberFilter.updatedAt = { $lt: cursorUpdatedAt };
    }

    const result = await ConversationMemberModel.find(memberFilter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    await redis.set(key, JSON.stringify(result), "EX", 20);
    return result;
  }
}