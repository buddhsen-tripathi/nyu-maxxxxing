"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "nyu-mx:user-context:v1";
const CHECKIN_LIMIT = 5;

type Persisted = {
  favoriteSpaces: string[];
  recentCheckins: string[]; // most recent first
};

type ChatContextValue = {
  // ── Reset ───────────────────────────────────────────────
  chatKey: number;
  newChat: () => void;

  // ── User context (persisted to localStorage) ───────────
  favoriteSpaces: string[];
  toggleFavoriteSpace: (id: string) => void;
  isFavoriteSpace: (id: string) => boolean;
  recentCheckins: string[];
  recordCheckin: (id: string) => void;

  // ── Snapshot for chat ───────────────────────────────────
  // Compact JSON-serializable bundle sent with every chat request.
  getUserContext: () => {
    pathname: string;
    favoriteSpaces: string[];
    recentCheckins: string[];
  };
};

const ChatContext = createContext<ChatContextValue | null>(null);

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return { favoriteSpaces: [], recentCheckins: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { favoriteSpaces: [], recentCheckins: [] };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      favoriteSpaces: Array.isArray(parsed.favoriteSpaces)
        ? parsed.favoriteSpaces
        : [],
      recentCheckins: Array.isArray(parsed.recentCheckins)
        ? parsed.recentCheckins
        : [],
    };
  } catch {
    return { favoriteSpaces: [], recentCheckins: [] };
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [chatKey, setChatKey] = useState(0);
  const [favoriteSpaces, setFavoriteSpaces] = useState<string[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<string[]>([]);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const persisted = loadPersisted();
    setFavoriteSpaces(persisted.favoriteSpaces);
    setRecentCheckins(persisted.recentCheckins);
  }, []);

  // Persist on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ favoriteSpaces, recentCheckins })
      );
    } catch {
      // quota exceeded, etc — silently ignore
    }
  }, [favoriteSpaces, recentCheckins]);

  const toggleFavoriteSpace = useCallback((id: string) => {
    setFavoriteSpaces((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const isFavoriteSpace = useCallback(
    (id: string) => favoriteSpaces.includes(id),
    [favoriteSpaces]
  );

  const recordCheckin = useCallback((id: string) => {
    setRecentCheckins((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)];
      return next.slice(0, CHECKIN_LIMIT);
    });
  }, []);

  const getUserContext = useCallback(
    () => ({ pathname, favoriteSpaces, recentCheckins }),
    [pathname, favoriteSpaces, recentCheckins]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      chatKey,
      newChat: () => setChatKey((k) => k + 1),
      favoriteSpaces,
      toggleFavoriteSpace,
      isFavoriteSpace,
      recentCheckins,
      recordCheckin,
      getUserContext,
    }),
    [
      chatKey,
      favoriteSpaces,
      toggleFavoriteSpace,
      isFavoriteSpace,
      recentCheckins,
      recordCheckin,
      getUserContext,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatReset() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatReset must be used within ChatProvider");
  return ctx;
}

// Convenience hooks for the spaces page and the chat page.
export function useUserContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useUserContext must be used within ChatProvider");
  return ctx;
}
