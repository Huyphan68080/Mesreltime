"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ChatMessageVm } from "@/store/useChatStore";

export const VirtualMessageList = ({ messages }: { messages: ChatMessageVm[] }) => {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 74,
    overscan: 10
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="h-[60vh] overflow-auto rounded-xl border border-[var(--line)] bg-[var(--panel)]">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative"
        }}
      >
        {items.map((item) => {
          const message = messages[item.index];

          return (
            <div
              key={item.key}
              className="absolute left-0 top-0 w-full border-b border-white/5 px-4 py-3"
              style={{
                transform: `translateY(${item.start}px)`
              }}
            >
              <div className="text-xs text-[var(--subtext)]">{message.senderId}</div>
              <div className="mt-1 text-sm leading-6 text-white">{message.content}</div>
              <div className="mt-1 text-[11px] text-[var(--subtext)]">{new Date(message.createdAt).toLocaleTimeString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
