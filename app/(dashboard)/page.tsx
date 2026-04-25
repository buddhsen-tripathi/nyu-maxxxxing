"use client";

import { useState } from "react";
import { Send, Sparkles, MapPin, ArrowLeftRight, Users } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  function handleSend(text?: string) {
    const content = text ?? input.trim();
    if (!content) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "This is a template response. Connect your AI backend to make this chat functional!",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              What can I help you with?
            </h2>
            <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
              Ask me about study spaces, exchange items, or finding a peer
              mentor. I'm your NYU campus companion.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-col gap-2 sm:flex-row">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.prompt)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                >
                  <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-card-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about NYU campus life..."
            className="flex-1 rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
