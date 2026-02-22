import { Schema, model } from "mongoose";

const conversationSchema = new Schema(
  {
    type: { type: String, enum: ["dm", "group"], required: true, index: true },
    title: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    memberCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: null, index: true }
  },
  { timestamps: true, versionKey: false }
);

const conversationMemberSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    lastReadMessageId: { type: Schema.Types.ObjectId, default: null },
    joinedAt: { type: Date, default: Date.now },
    mutedUntil: { type: Date, default: null },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

conversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
conversationMemberSchema.index({ userId: 1, updatedAt: -1 });

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, required: true, index: true },
    clientMessageId: { type: String, default: null },
    content: { type: String, required: true },
    attachments: {
      type: [
        {
          key: String,
          url: String,
          mimeType: String,
          size: Number
        }
      ],
      default: []
    },
    parentMessageId: { type: Schema.Types.ObjectId, default: null, index: true },
    mentions: { type: [Schema.Types.ObjectId], default: [] },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

messageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });
messageSchema.index({ conversationId: 1, clientMessageId: 1 }, { unique: true, sparse: true });
messageSchema.index({ content: "text" });

const messageReceiptSchema = new Schema(
  {
    messageId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

messageReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });

const reactionSchema = new Schema(
  {
    messageId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    emoji: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);

reactionSchema.index({ messageId: 1, emoji: 1, userId: 1 }, { unique: true });

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, versionKey: false }
);

auditLogSchema.index({ createdAt: -1 });

const idempotencyKeySchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    responseRef: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true, versionKey: false }
);

idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ConversationModel = model("conversations", conversationSchema);
export const ConversationMemberModel = model("conversation_members", conversationMemberSchema);
export const MessageModel = model("messages", messageSchema);
export const MessageReceiptModel = model("message_receipts", messageReceiptSchema);
export const ReactionModel = model("reactions", reactionSchema);
export const AuditLogModel = model("audit_logs", auditLogSchema);
export const IdempotencyKeyModel = model("idempotency_keys", idempotencyKeySchema);
