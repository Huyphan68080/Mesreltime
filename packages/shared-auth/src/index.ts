import type { JwtPayload, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { randomUUID, createHash } from "node:crypto";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface TokenSignerInput {
  userId: string;
  roles: string[];
}

export const issueTokenPair = (
  payload: TokenSignerInput,
  accessSecret: string,
  refreshSecret: string,
  accessTtl: SignOptions["expiresIn"] = "15m",
  refreshTtl: SignOptions["expiresIn"] = "30d"
): TokenPair => {
  const sessionId = randomUUID();

  const baseClaims = {
    sub: payload.userId,
    sid: sessionId,
    roles: payload.roles
  };

  const accessToken = jwt.sign(baseClaims, accessSecret, { expiresIn: accessTtl });
  const refreshToken = jwt.sign(baseClaims, refreshSecret, { expiresIn: refreshTtl });

  return {
    accessToken,
    refreshToken,
    sessionId
  };
};

export const verifyAccessToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};