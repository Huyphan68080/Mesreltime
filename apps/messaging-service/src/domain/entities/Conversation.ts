export interface Conversation {
  id: string;
  type: "dm" | "group";
  title?: string;
  ownerId: string;
  memberCount: number;
  lastMessageAt?: Date;
}