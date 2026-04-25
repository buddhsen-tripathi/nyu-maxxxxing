"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import {
  ArrowUp,
  MapPin,
  ArrowLeftRight,
  Users,
  GraduationCap,
  Loader2,
} from "lucide-react";

const suggestions = [
  {
    icon: MapPin,
    label: "Find a quiet study spot",
    prompt: "Find me a quiet study spot near Tandon that's open right now",
  },
  {
    icon: ArrowLeftRight,
    label: "List my items for sale",
    prompt: "Help me list my used calculus textbook on the exchange",
  },
  {
    icon: Users,
    label: "Find a mentor",
    prompt: "I need a quick chat with someone who's taken CS-UY 2124",
  },
];

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function handleSend(text?: string) {
    const content = text ?? input.trim();
    if (!content || isLoading) return;
    sendMessage({ text: content });
    setInput("");
  }

  /* ── Empty state ── */
  if (messages.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <h1 className="mb-8 text-center text-3xl font-semibold text-foreground">
            What can I help you with?
          </h1>

          {/* Input */}
          <div className="mb-4 rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-end gap-2 p-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything about NYU campus life..."
                rows={1}
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSend(s.prompt)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Conversation view ── */
  return (
    <div className="flex min-h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
          {messages.map((msg) => {
            // Skip tool-only assistant messages with no text
            if (
              msg.role === "assistant" &&
              !msg.parts.some((p) => p.type === "text" && p.text.trim())
            ) {
              return null;
            }

            const textContent = msg.parts
              .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
              .map((p) => p.text)
              .join("");

            if (!textContent.trim()) return null;

            return (
              <div key={msg.id} className="flex gap-3">
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border">
                    <GraduationCap className="h-4 w-4 text-foreground/70" />
                  </div>
                )}
                <div
                  className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}
                >
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-secondary text-secondary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {textContent}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading &&
            !messages[messages.length - 1]?.parts.some(
              (p) => p.type === "text" && p.text.trim()
            ) && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border">
                  <GraduationCap className="h-4 w-4 text-foreground/70" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Bottom input */}
      <div className="px-4 pb-6 pt-2">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-end gap-2 p-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything..."
                rows={1}
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
