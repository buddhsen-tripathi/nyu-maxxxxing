"use client";

import { createContext, useContext, useState } from "react";

type ChatContextValue = {
  chatKey: number;
  newChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatKey, setChatKey] = useState(0);
  return (
    <ChatContext.Provider
      value={{ chatKey, newChat: () => setChatKey((k) => k + 1) }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatReset() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatReset must be used within ChatProvider");
  return ctx;
}
