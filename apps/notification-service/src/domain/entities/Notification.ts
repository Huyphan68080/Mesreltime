export interface Notification {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  state: "pending" | "sent" | "read";
  createdAt: Date;
}