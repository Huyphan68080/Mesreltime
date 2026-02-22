import { sendMessageSchema } from "@mesreltime/shared-zod";
import { ConversationRepository } from "../../infrastructure/repositories/ConversationRepository.js";
import { MessageRepository } from "../../infrastructure/repositories/MessageRepository.js";

export class MessagingService {
  constructor(
    private readonly conversations = new ConversationRepository(),
    private readonly messages = new MessageRepository()
  ) {}

  async createMessageIdempotent(userId: string, payload: unknown) {
    const input = sendMessageSchema.parse(payload);
    const content = input.content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();

    if (!content) {
      throw new Error("Message content is empty after sanitization");
    }

    await this.conversations.ensureMember(userId, input.conversationId);

    return this.messages.createIdempotent({
      conversationId: input.conversationId,
      senderId: userId,
      clientMessageId: input.clientMessageId,
      content,
      parentMessageId: input.parentMessageId,
      attachments: input.attachments
    });
  }

  async listMessages(userId: string, params: {
    conversationId: string;
    limit: number;
    beforeId?: string;
    beforeCreatedAt?: Date;
  }) {
    await this.conversations.ensureMember(userId, params.conversationId);
    return this.messages.listByConversation(params);
  }
}
