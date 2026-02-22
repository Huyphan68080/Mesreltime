export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  roles: string[];
  status: "active" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}
