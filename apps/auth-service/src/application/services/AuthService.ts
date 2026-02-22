import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hashToken, issueTokenPair } from "@mesreltime/shared-auth";
import { env } from "../../config/env.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";
import { RefreshTokenRepository } from "../../infrastructure/repositories/RefreshTokenRepository.js";

export class AuthService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly refreshTokens = new RefreshTokenRepository()
  ) {}

  async register(input: { email: string; username: string; password: string; deviceId: string }) {
    const existing = await this.users.findByEmail(input.email);

    if (existing) {
      throw new Error("Email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash
    });

    return this.issueAndStoreTokens({
      userId: String(user._id),
      roles: user.roles,
      deviceId: input.deviceId
    });
  }

  async login(input: { email: string; password: string; deviceId: string }) {
    const user = await this.users.findByEmail(input.email);

    if (!user || user.status !== "active") {
      throw new Error("Invalid credentials");
    }

    const matched = await bcrypt.compare(input.password, user.passwordHash);

    if (!matched) {
      throw new Error("Invalid credentials");
    }

    return this.issueAndStoreTokens({
      userId: String(user._id),
      roles: user.roles,
      deviceId: input.deviceId
    });
  }

  async refresh(input: { refreshToken: string; deviceId: string }) {
    const payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;

    const userId = String(payload.sub);
    const sessionId = String(payload.sid);

    const session = await this.refreshTokens.findActiveBySession(userId, sessionId);

    if (!session || session.tokenHash !== hashToken(input.refreshToken)) {
      throw new Error("Invalid refresh token");
    }

    const user = await this.users.findById(userId);

    if (!user || user.status !== "active") {
      throw new Error("User not active");
    }

    return this.issueAndStoreTokens({
      userId,
      roles: user.roles,
      deviceId: input.deviceId
    });
  }

  async logout(input: { refreshToken: string }) {
    const payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
    await this.refreshTokens.revokeSession(String(payload.sub), String(payload.sid));
  }

  private async issueAndStoreTokens(input: { userId: string; roles: string[]; deviceId: string }) {
    const tokens = issueTokenPair(
      { userId: input.userId, roles: input.roles },
      env.JWT_ACCESS_SECRET,
      env.JWT_REFRESH_SECRET,
      env.ACCESS_TOKEN_TTL as any,
      env.REFRESH_TOKEN_TTL as any
    );

    const refreshPayload = jwt.decode(tokens.refreshToken) as jwt.JwtPayload;
    const expiresAt = new Date((refreshPayload.exp ?? 0) * 1000);

    await this.refreshTokens.upsert({
      userId: input.userId,
      sessionId: tokens.sessionId,
      tokenHash: hashToken(tokens.refreshToken),
      deviceId: input.deviceId,
      expiresAt
    });

    return tokens;
  }
}
