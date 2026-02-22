import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { AuthService } from "../../application/services/AuthService.js";

const deviceSchema = z.string().min(1).max(128);

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
  deviceId: deviceSchema
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  deviceId: deviceSchema
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
  deviceId: deviceSchema
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

const setAuthCookies = (reply: any, tokens: { accessToken: string; refreshToken: string }) => {
  reply.setCookie("accessToken", tokens.accessToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 15
  });

  reply.setCookie("refreshToken", tokens.refreshToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30
  });

  reply.setCookie("csrfToken", randomUUID(), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30
  });
};

export const registerAuthHttpRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const auth = new AuthService();

  fastify.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const tokens = await auth.register(input);
    setAuthCookies(reply, tokens);
    reply.code(201).send(tokens);
  });

  fastify.post("/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const tokens = await auth.login(input);
    setAuthCookies(reply, tokens);
    reply.send(tokens);
  });

  fastify.post("/refresh", async (request, reply) => {
    const body = refreshSchema.parse(request.body ?? {});
    const refreshToken = body.refreshToken ?? request.cookies.refreshToken;

    if (!refreshToken) {
      throw new Error("Missing refresh token");
    }

    const tokens = await auth.refresh({
      refreshToken,
      deviceId: body.deviceId
    });
    setAuthCookies(reply, tokens);
    reply.send(tokens);
  });

  fastify.post("/logout", async (request, reply) => {
    const body = logoutSchema.parse(request.body ?? {});
    const refreshToken = body.refreshToken ?? request.cookies.refreshToken;

    if (!refreshToken) {
      throw new Error("Missing refresh token");
    }

    await auth.logout({ refreshToken });
    reply.clearCookie("accessToken", { path: "/" });
    reply.clearCookie("refreshToken", { path: "/" });
    reply.clearCookie("csrfToken", { path: "/" });
    reply.code(204).send();
  });
};
