import { UserModel } from "../db/models.js";

export class UserRepository {
  async create(input: {
    email: string;
    username: string;
    passwordHash: string;
    roles?: string[];
  }) {
    return UserModel.create({
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      roles: input.roles ?? ["member"]
    });
  }

  async findByEmail(email: string) {
    return UserModel.findOne({ email }).lean();
  }

  async findById(id: string) {
    return UserModel.findById(id).lean();
  }
}
