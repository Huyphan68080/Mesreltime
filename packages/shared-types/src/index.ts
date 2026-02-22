export type UserRole = "owner" | "admin" | "member";

export interface JwtClaims {
  sub: string;
  sid: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  parentMessageId?: string;
  attachments: MessageAttachment[];
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface MessageAttachment {
  key: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface PaginationCursor {
  createdAt: string;
  id: string;
}
