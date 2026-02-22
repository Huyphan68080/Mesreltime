import type { FastifyReply, FastifyRequest } from "fastify";

export const proxyRequest = async (
  req: FastifyRequest,
  reply: FastifyReply,
  targetBase: string,
  rewrittenPath: string
): Promise<void> => {
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") {
      headers[key] = value;
    }
  }

  const body = req.body ? JSON.stringify(req.body) : undefined;
  const shouldAppendQuery = !rewrittenPath.includes("?") && req.url.includes("?");
  const targetUrl = `${targetBase}${rewrittenPath}${shouldAppendQuery ? req.url.slice(req.url.indexOf("?")) : ""}`;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body
  });

  const text = await upstream.text();

  reply.code(upstream.status);
  upstream.headers.forEach((v, k) => reply.header(k, v));
  reply.send(text);
};
