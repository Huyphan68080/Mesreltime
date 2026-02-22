# Database Schema and Index Strategy

## Collections

### users
- `_id`, `email`, `username`, `passwordHash`, `roles[]`, `status`, timestamps

### refresh_tokens
- `userId`, `sessionId`, `tokenHash`, `deviceId`, `expiresAt`, `revokedAt`, timestamps

### conversations
- `type` (`dm|group`), `title`, `ownerId`, `memberCount`, `lastMessageAt`, timestamps

### conversation_members
- `conversationId`, `userId`, `role`, `lastReadMessageId`, `joinedAt`, `mutedUntil`, `isArchived`, timestamps

### messages
- `conversationId`, `senderId`, `clientMessageId`, `content`, `attachments[]`, `parentMessageId`, `mentions[]`, `editedAt`, `deletedAt`, timestamps

### message_receipts
- `messageId`, `userId`, `deliveredAt`, `readAt`, timestamps

### reactions
- `messageId`, `userId`, `emoji`, timestamps

### notifications
- `userId`, `type`, `payload`, `state`, `batchedAt`, timestamps

### audit_logs
- `actorId`, `action`, `entityType`, `entityId`, `metadata`, timestamps

### idempotency_keys
- `key`, `userId`, `responseRef`, `expiresAt`, timestamps

## Indexes

```javascript
db.messages.createIndex({ conversationId: 1, createdAt: -1, _id: -1 })
db.messages.createIndex({ conversationId: 1, clientMessageId: 1 }, { unique: true, sparse: true })
db.messages.createIndex({ content: "text" })

db.conversation_members.createIndex({ conversationId: 1, userId: 1 }, { unique: true })
db.conversation_members.createIndex({ userId: 1, updatedAt: -1 })

db.message_receipts.createIndex({ messageId: 1, userId: 1 }, { unique: true })
db.reactions.createIndex({ messageId: 1, emoji: 1, userId: 1 }, { unique: true })

db.refresh_tokens.createIndex({ userId: 1, sessionId: 1 }, { unique: true })
db.refresh_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

db.idempotency_keys.createIndex({ key: 1 }, { unique: true })
db.idempotency_keys.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

## Sharding notes

- Target shard key for `messages`: `{ conversationId: "hashed" }`.
- Benefits: evenly distributed write load across active conversations.
- Trade-off: cross-conversation queries become scatter/gather; keep them limited and async.
