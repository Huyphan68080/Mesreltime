import { create } from "zustand";

export interface ChatMessageVm {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ChatState {
  messages: ChatMessageVm[];
  typingUserIds: string[];
  onlineUserIds: string[];
  pushMessage: (message: ChatMessageVm) => void;
  setMessages: (messages: ChatMessageVm[]) => void;
  setTypingUsers: (userIds: string[]) => void;
  setOnlineUsers: (userIds: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  typingUserIds: [],
  onlineUserIds: [],
  pushMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setTypingUsers: (typingUserIds) => set({ typingUserIds }),
  setOnlineUsers: (onlineUserIds) => set({ onlineUserIds })
}));
