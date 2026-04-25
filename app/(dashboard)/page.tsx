"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowRight,
  MapPin,
  ArrowLeftRight,
  Users,
  GraduationCap,
  Loader2,
  Printer,
  MessageCircle,
  Paperclip,
  X,
  FileText,
  ImageIcon,
  CalendarCheck,
  ExternalLink,
} from "lucide-react";
import { useChatReset, useUserContext, CHAT_MESSAGES_KEY } from "./chat-context";
import { uploadChatImageAction } from "./chat-actions";
import { Markdown } from "../components/markdown";

type NavTab = "spaces" | "exchange" | "mentoring" | "printers" | "home";

const TAB_ICONS: Record<NavTab, typeof MapPin> = {
  spaces: MapPin,
  exchange: ArrowLeftRight,
  mentoring: Users,
  printers: Printer,
  home: MessageCircle,
};

const suggestions = [
  {
    icon: MapPin,
    label: "Find a study spot",
    prompt: "Help me find a good place to study",
  },
  {
    icon: ArrowLeftRight,
    label: "Browse the exchange",
    prompt: "What's on the exchange right now?",
  },
  {
    icon: Users,
    label: "Talk to a mentor",
    prompt: "Connect me with a peer mentor",
  },
  {
    icon: Printer,
    label: "Find a printer",
    prompt: "Where can I print right now?",
  },
];

export default function ChatPage() {
  const { chatKey } = useChatReset();
  return <ChatInner key={chatKey} />;
}

function ChatInner() {
  const { getUserContext } = useUserContext();

  // Build a transport that injects fresh userContext into every request.
  // Using a function for `body` ensures we always send the current state
  // (favorites/check-ins) at send time, not at hook init.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ userContext: getUserContext() }),
      }),
    [getUserContext]
  );

  const { messages, sendMessage, status, setMessages } = useChat({ transport });
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  // Hydrate messages from localStorage once on mount, then mark ready.
  // Gating the render on `hydrated` avoids the empty-state flash when the
  // user navigates back to the chat tab and we have saved messages.
  useEffect(() => {
    if (typeof window === "undefined") {
      setHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(CHAT_MESSAGES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // corrupt JSON or quota — fall through to empty state
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages on every change (post-hydration, while not streaming).
  // Skipping during streaming avoids hundreds of localStorage writes per second
  // as text deltas roll in; the final state lands on `status === "ready"`.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (status === "submitted" || status === "streaming") return;
    try {
      if (messages.length === 0) {
        localStorage.removeItem(CHAT_MESSAGES_KEY);
      } else {
        localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
      }
    } catch {
      // quota exceeded — silently ignore
    }
  }, [messages, status, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(text?: string) {
    const content = text ?? input.trim();
    if ((!content && files.length === 0) || isLoading) return;

    // Convert File[] to FileUIPart[] (data URLs) so the model can SEE them.
    const fileParts =
      files.length > 0
        ? await Promise.all(
            files.map(
              (f) =>
                new Promise<{
                  type: "file";
                  mediaType: string;
                  url: string;
                  filename: string;
                }>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () =>
                    resolve({
                      type: "file",
                      mediaType: f.type || "application/octet-stream",
                      url: reader.result as string,
                      filename: f.name,
                    });
                  reader.onerror = () => reject(reader.error);
                  reader.readAsDataURL(f);
                })
            )
          )
        : undefined;

    // For image attachments, ALSO upload to AgentBucket in parallel so the
    // agent has a real URL it can pass to tools like createExchangeListing.
    let messageText = content;
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      const uploads = await Promise.all(
        imageFiles.map(async (f) => {
          const fd = new FormData();
          fd.append("file", f);
          return uploadChatImageAction(fd);
        })
      );
      const urls = uploads
        .filter((u): u is { success: true; result: { fileName: string; publicUrl: string } } => u.success)
        .map((u) => u.result.publicUrl);
      if (urls.length > 0) {
        const marker = `\n\n[ATTACHED_IMAGE_URLS]: ${urls.join(", ")}`;
        messageText = (content + marker).trim();
      }
    }

    sendMessage({ text: messageText, files: fileParts });
    setInput("");
    setFiles([]);
  }

  function addFiles(picked: FileList | null) {
    if (!picked) return;
    const next: File[] = [];
    for (const f of Array.from(picked)) {
      if (f.size > 10 * 1024 * 1024) continue; // 10 MB cap
      next.push(f);
    }
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFileAt(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  /* ── Hydrating placeholder ── */
  // Render an invisible shell that takes the same vertical space as the
  // empty state, so the layout doesn't shift when saved messages load in.
  if (!hydrated) {
    return <div className="flex min-h-full" aria-hidden />;
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
            <FileChipRow files={files} onRemove={removeFileAt} />
            <div className="flex items-end gap-2 p-2">
              <AttachButton onPick={addFiles} />
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
                className="max-h-40 min-h-[32px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && files.length === 0) || isLoading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
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
            const textContent = msg.parts
              .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
              .map((p) => p.text)
              .join("")
              // Strip the internal marker we use to ferry image URLs to the agent
              .replace(/\n*\[ATTACHED_IMAGE_URLS\]:[\s\S]*$/, "")
              .trim();

            // Image / file attachments echoed back from the user
            const attachmentParts = msg.parts.flatMap((p) => {
              const part = p as Record<string, unknown>;
              const t = part.type as string | undefined;
              if (t === "file" || t === "image") {
                const url = (part.url ?? part.image ?? part.data) as string | undefined;
                const mediaType = (part.mediaType ?? part.contentType ?? part.mimeType) as
                  | string
                  | undefined;
                if (typeof url !== "string") return [];
                return [{ url, mediaType: mediaType ?? "" }];
              }
              return [];
            });

            const navButtons = msg.parts.flatMap((p) => {
              if (
                p.type === "tool-navigateTo" &&
                p.state === "output-available" &&
                p.output &&
                typeof p.output === "object"
              ) {
                const out = p.output as { tab: NavTab; href: string; label: string };
                return [{ id: p.toolCallId, ...out }];
              }
              return [];
            });

            const bookButtons = msg.parts.flatMap((p) => {
              if (
                p.type === "tool-bookRoom" &&
                p.state === "output-available" &&
                p.output &&
                typeof p.output === "object"
              ) {
                const out = p.output as {
                  found: number;
                  bookingUrl?: string;
                  label?: string;
                };
                if (out.found === 1 && out.bookingUrl) {
                  return [
                    {
                      id: p.toolCallId,
                      bookingUrl: out.bookingUrl,
                      label: out.label ?? "Book this room",
                    },
                  ];
                }
              }
              return [];
            });

            // Skip empty assistant messages (no text + no nav/book buttons)
            if (
              msg.role === "assistant" &&
              !textContent.trim() &&
              navButtons.length === 0 &&
              bookButtons.length === 0 &&
              attachmentParts.length === 0
            ) {
              return null;
            }

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
                  {attachmentParts.length > 0 && (
                    <div
                      className={`mb-2 flex flex-wrap gap-2 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {attachmentParts.map((a, i) =>
                        a.mediaType.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={a.url}
                            alt="attachment"
                            className="max-h-48 rounded-lg border border-border"
                          />
                        ) : (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Attachment</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {textContent.trim() && (
                    <div
                      className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-secondary text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap"
                          : "text-foreground"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <Markdown text={textContent} />
                      ) : (
                        textContent
                      )}
                    </div>
                  )}

                  {(navButtons.length > 0 || bookButtons.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {bookButtons.map((btn) => (
                        <a
                          key={btn.id}
                          href={btn.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                        >
                          <CalendarCheck className="h-3.5 w-3.5" />
                          <span>{btn.label}</span>
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </a>
                      ))}
                      {navButtons.map((btn) => {
                        const Icon = TAB_ICONS[btn.tab] ?? ArrowRight;
                        return (
                          <Link
                            key={btn.id}
                            href={btn.href}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
                          >
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{btn.label}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
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
            <FileChipRow files={files} onRemove={removeFileAt} />
            <div className="flex items-end gap-2 p-2">
              <AttachButton onPick={addFiles} />
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
                className="max-h-40 min-h-[32px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && files.length === 0) || isLoading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
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

/* ── Attachment helpers ──────────────────────────────────────────────────── */

function AttachButton({ onPick }: { onPick: (files: FileList | null) => void }) {
  return (
    <label
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      title="Attach a file"
    >
      <Paperclip className="h-4 w-4" />
      <input
        type="file"
        multiple
        accept="image/*,.pdf,.txt"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function FileChipRow({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (idx: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 border-b border-border px-3 pt-3">
      {files.map((f, i) => {
        const isImage = f.type.startsWith("image/");
        const Icon = isImage ? ImageIcon : FileText;
        return (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 text-xs"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="max-w-[160px] truncate">{f.name}</span>
            <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
