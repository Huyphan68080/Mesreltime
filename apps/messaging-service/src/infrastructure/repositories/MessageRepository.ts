import { Types } from "mongoose";
import {
  AuditLogModel,
  ConversationModel,
  MessageModel,
  MessageReceiptModel,
  ReactionModel
} from "../db/models.js";

export class MessageRepository {
  async createIdempotent(input: {
    conversationId: string;
    senderId: string;
    clientMessageId: string;
    content: string;
    parentMessageId?: string;
    attachments?: Array<{ key: string; url: string; mimeType: string; size: number }>;
  }) {
    const created = await MessageModel.findOneAndUpdate(
      {
        conversationId: new Types.ObjectId(input.conversationId),
        clientMessageId: input.clientMessageId
      },
      {
        $setOnInsert: {
          conversationId: new Types.ObjectId(input.conversationId),
          senderId: new Types.ObjectId(input.senderId),
          clientMessageId: input.clientMessageId,
          content: input.content,
          parentMessageId: input.parentMessageId ? new Types.ObjectId(input.parentMessageId) : null,
          attachments: input.attachments ?? []
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await ConversationModel.updateOne(
      { _id: new Types.ObjectId(input.conversationId) },
      { $set: { lastMessageAt: new Date() } }
    );

    await AuditLogModel.create({
      actorId: new Types.ObjectId(input.senderId),
      action: "message.create",
      entityType: "message",
      entityId: String(created._id),
      metadata: { conversationId: input.conversationId }
    });

    return created;
  }

  async listByConversation(input: { conversationId: string; limit: number; beforeId?: string; beforeCreatedAt?: Date }) {
    const filter: any = { conversationId: new Types.ObjectId(input.conversationId) };

    if (input.beforeCreatedAt && input.beforeId) {
      filter.$or = [
        { createdAt: { $lt: input.beforeCreatedAt } },
        { createdAt: input.beforeCreatedAt, _id: { $lt: new Types.ObjectId(input.beforeId) } }
      ];
    }

    return MessageModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(input.limit)
      .lean();
  }

  async findById(messageId: string) {
    return MessageModel.findById(new Types.ObjectId(messageId)).lean();
  }

  async editMessage(input: { messageId: string; senderId: string; content: string }) {
    const updated = await MessageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(input.messageId),
        senderId: new Types.ObjectId(input.senderId),
        deletedAt: null
      },
      {
        $set: {
          content: input.content,
          editedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      throw new Error("Message not found or forbidden");
    }

    await AuditLogModel.create({
      actorId: new Types.ObjectId(input.senderId),
      action: "message.edit",
      entityType: "message",
      entityId: input.messageId,
      metadata: {}
    });

    return updated;
  }

  async deleteMessage(input: { messageId: string; senderId: string }) {
    const deleted = await MessageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(input.messageId),
        senderId: new Types.ObjectId(input.senderId),
        deletedAt: null
      },
      {
        $set: {
          content: "[deleted]",
          deletedAt: new Date()
        }
      },
      { new: true }
    );

    if (!deleted) {
      throw new Error("Message not found or forbidden");
    }

    await AuditLogModel.create({
      actorId: new Types.ObjectId(input.senderId),
      action: "message.delete",
      entityType: "message",
      entityId: input.messageId,
      metadata: {}
    });

    return deleted;
  }

  async markRead(input: { messageId: string; userId: string }) {
    await MessageReceiptModel.updateOne(
      {
        messageId: new Types.ObjectId(input.messageId),
        userId: new Types.ObjectId(input.userId)
      },
      {
        $set: {
          deliveredAt: new Date(),
          readAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  async addReaction(input: { messageId: string; userId: string; emoji: string }) {
    await ReactionModel.updateOne(
      {
        messageId: new Types.ObjectId(input.messageId),
        userId: new Types.ObjectId(input.userId),
        emoji: input.emoji
      },
      {
        $setOnInsert: {
          messageId: new Types.ObjectId(input.messageId),
          userId: new Types.ObjectId(input.userId),
          emoji: input.emoji
        }
      },
      { upsert: true }
    );
  }

  async removeReaction(input: { messageId: string; userId: string; emoji: string }) {
    await ReactionModel.deleteOne({
      messageId: new Types.ObjectId(input.messageId),
      userId: new Types.ObjectId(input.userId),
      emoji: input.emoji
    });
  }

  async searchMessages(query: string, conversationIds: string[], limit: number) {
    return MessageModel.find(
      {
        $text: { $search: query },
        conversationId: { $in: conversationIds.map((id) => new Types.ObjectId(id)) }
      },
      {
        score: { $meta: "textScore" }
      }
    )
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
