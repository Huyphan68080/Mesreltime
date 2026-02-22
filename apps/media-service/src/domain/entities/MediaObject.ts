export interface MediaObject {
  id: string;
  userId: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  encrypted: boolean;
  status: "pending" | "completed";
}