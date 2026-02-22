import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const sendMessageSchema = z.object({
  conversationId: objectIdSchema,
  clientMessageId: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
  parentMessageId: objectIdSchema.optional(),
  attachments: z.array(
    z.object({
      key: z.string().min(1),
      url: z.string().url(),
      mimeType: z.string().min(1),
      size: z.number().int().nonnegative()
    })
  ).max(10).default([])
});

export const typingSchema = z.object({
  conversationId: objectIdSchema,
  isTyping: z.boolean()
});
