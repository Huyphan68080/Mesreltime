"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { VirtualMessageList } from "./VirtualMessageList";

interface ChatClientProps {
  conversationId: string;
}

const fetchMessages = async (conversationId: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/conversations/${conversationId}/messages?limit=50`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEV_BEARER ?? ""}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }

  return res.json();
};

export const ChatClient = ({ conversationId }: ChatClientProps) => {
  const token = process.env.NEXT_PUBLIC_DEV_BEARER ?? "";
  const [draft, setDraft] = useState("");

  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const pushMessage = useChatStore((s) => s.pushMessage);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: Boolean(conversationId && token)
  });

  useEffect(() => {
    if (Array.isArray(data)) {
      setMessages(
        data
          .slice()
          .reverse()
          .map((item: any) => ({
            id: String(item._id),
            conversationId: String(item.conversationId),
            senderId: String(item.senderId),
            content: String(item.content),
            createdAt: new Date(item.createdAt).toISOString()
          }))
      );
    }
  }, [data, setMessages]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getSocket(token);

    socket.emit("room.join", { conversationId });

    socket.on("message.new", (payload: any) => {
      if (String(payload.conversationId) !== conversationId) {
        return;
      }

      pushMessage({
        id: String(payload._id),
        conversationId: String(payload.conversationId),
        senderId: String(payload.senderId),
        content: String(payload.content),
        createdAt: new Date(payload.createdAt).toISOString()
      });

      socket.emit("message.ack", {
        conversationId,
        messageId: String(payload._id)
      });
    });

    return () => {
      socket.emit("room.leave", { conversationId });
      socket.off("message.new");
    };
  }, [conversationId, pushMessage, token]);

  const canSend = useMemo(() => draft.trim().length > 0, [draft]);

  const sendMessage = () => {
    if (!canSend || !token) {
      return;
    }

    const socket = getSocket(token);

    socket.emit("message.send", {
      conversationId,
      clientMessageId: crypto.randomUUID(),
      content: draft.trim(),
      attachments: []
    });

    setDraft("");
  };

  return (
    <section className="fade-in rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-glow">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Conversation {conversationId.slice(0, 8)}</h2>
        <span className="text-xs text-[var(--subtext)]">Realtime + virtualized</span>
      </header>

      {isLoading ? <p className="text-sm text-[var(--subtext)]">Loading messages...</p> : <VirtualMessageList messages={messages} />}

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-cyan focus:ring-2"
        />
        <button
          type="button"
          onClick={sendMessage}
          className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          disabled={!canSend}
        >
          Send
        </button>
      </div>
    </section>
  );
};
