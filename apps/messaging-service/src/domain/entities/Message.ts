export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId?: string;
  content: string;
  parentMessageId?: string;
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}