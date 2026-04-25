"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Calendar,
  ArrowUp,
  Plus,
  X,
  MapPin,
  Search,
} from "lucide-react";

type NoteType = "heads_up" | "working" | "suggestion" | "event";

type Note = {
  id: number;
  type: NoteType;
  title: string;
  body: string;
  authorName: string;
  location: string;
  upvotes: number;
  createdAt: string;
};

type SortOption = "newest" | "popular";

const typeConfig: Record<
  NoteType,
  {
    label: string;
    icon: typeof AlertTriangle;
    badge: string;
    accent: string;
  }
> = {
  heads_up: {
    label: "Heads Up",
    icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    accent: "border-l-amber-500",
  },
  working: {
    label: "Working Well",
    icon: CheckCircle2,
    badge: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
    accent: "border-l-green-500",
  },
  suggestion: {
    label: "Suggestion",
    icon: Lightbulb,
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    accent: "border-l-blue-500",
  },
  event: {
    label: "Event",
    icon: Calendar,
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
    accent: "border-l-purple-500",
  },
};

const filterOptions: Array<"all" | NoteType> = [
  "all",
  "heads_up",
  "working",
  "suggestion",
  "event",
];

function formatPosted(iso: string) {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "Recently";

  const minutesAgo = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000));
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}h ago`;
  return `${Math.floor(minutesAgo / 1440)}d ago`;
}

export default function CommunityNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<"all" | NoteType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    type: "heads_up" as NoteType,
    title: "",
    body: "",
    authorName: "",
    location: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("community-notes-upvoted");
    if (stored) {
      try {
        setUpvoted(new Set(JSON.parse(stored)));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetch("/api/community-notes", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load community notes.");
        const payload = (await res.json()) as { notes: Note[] };
        setNotes(payload.notes);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Unable to load notes.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = notes.filter((note) => {
      const typeMatch = filter === "all" || note.type === filter;
      const searchMatch =
        q.length === 0 ||
        note.title.toLowerCase().includes(q) ||
        note.body.toLowerCase().includes(q) ||
        note.location.toLowerCase().includes(q);
      return typeMatch && searchMatch;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "popular") return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted;
  }, [notes, filter, sortBy, searchQuery]);

  const handleUpvote = async (id: number) => {
    if (upvoted.has(id)) return;

    setNotes((current) =>
      current.map((n) => (n.id === id ? { ...n, upvotes: n.upvotes + 1 } : n)),
    );
    const next = new Set(upvoted);
    next.add(id);
    setUpvoted(next);
    localStorage.setItem("community-notes-upvoted", JSON.stringify([...next]));

    try {
      await fetch(`/api/community-notes/${id}/upvote`, { method: "POST" });
    } catch {
      // optimistic update stays
    }
  };

  const submitNote = async () => {
    const title = form.title.trim();
    const body = form.body.trim();

    if (!title || !body) {
      setFormError("Please fill in both the title and the note body.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const res = await fetch("/api/community-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title,
          body,
          authorName: form.authorName.trim() || undefined,
          location: form.location.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to post note.");
      }

      const payload = (await res.json()) as { note: Note };
      setNotes((current) => [payload.note, ...current]);
      setForm({ type: "heads_up", title: "", body: "", authorName: "", location: "" });
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to post note.");
    } finally {
      setSubmitting(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<"all" | NoteType, number> = {
      all: notes.length,
      heads_up: 0,
      working: 0,
      suggestion: 0,
      event: 0,
    };
    notes.forEach((n) => {
      c[n.type] = (c[n.type] ?? 0) + 1;
    });
    return c;
  }, [notes]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Community Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share what's working, flag issues, suggest improvements, or post about
            things happening on campus.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={() => {
            setFormError("");
            setIsFormOpen(true);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Post Note
        </button>
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, body, or location"
            value={searchQuery}
          />
        </label>

        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          value={sortBy}
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Upvoted</option>
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterOptions.map((opt) => {
          const label = opt === "all" ? "All" : typeConfig[opt].label;
          const count = counts[opt] ?? 0;
          const Icon = opt === "all" ? null : typeConfig[opt].icon;
          const active = filter === opt;
          return (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-accent"
              }`}
              type="button"
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {label} ({count})
            </button>
          );
        })}
      </div>

      {loadError ? (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading notes...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No notes yet. Be the first to post.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((note) => {
            const cfg = typeConfig[note.type];
            const Icon = cfg.icon;
            const hasUpvoted = upvoted.has(note.id);

            return (
              <div
                key={note.id}
                className={`flex flex-col rounded-lg border border-l-4 border-border bg-card p-5 transition-shadow hover:shadow-md ${cfg.accent}`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${cfg.badge}`}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatPosted(note.createdAt)}
                  </span>
                </div>

                <h3 className="mb-1 font-medium leading-snug">{note.title}</h3>
                <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {note.body}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    {note.location ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {note.location}
                      </span>
                    ) : null}
                    {note.authorName ? <span>— {note.authorName}</span> : null}
                  </div>

                  <button
                    onClick={() => handleUpvote(note.id)}
                    disabled={hasUpvoted}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                      hasUpvoted
                        ? "border-primary/40 bg-primary/10 text-primary cursor-default"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                    type="button"
                    title={hasUpvoted ? "You've upvoted this" : "Upvote"}
                  >
                    <ArrowUp className="h-3 w-3" />
                    {note.upvotes}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto my-4 w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Post a Community Note</h2>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["heads_up", "working", "suggestion", "event"] as NoteType[]).map(
                    (t) => {
                      const cfg = typeConfig[t];
                      const Icon = cfg.icon;
                      const active = form.type === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setForm((c) => ({ ...c, type: t }))}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            active
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border bg-background hover:bg-accent"
                          }`}
                          type="button"
                        >
                          <Icon className="h-4 w-4" />
                          {cfg.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <input
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                placeholder="Short title — what's the note about?"
                value={form.title}
                maxLength={120}
              />

              <textarea
                className="min-h-28 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                onChange={(e) => setForm((c) => ({ ...c, body: e.target.value }))}
                placeholder="Details — what's happening, what should others know?"
                value={form.body}
                maxLength={2000}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(e) =>
                    setForm((c) => ({ ...c, location: e.target.value }))
                  }
                  placeholder="Location (optional)"
                  value={form.location}
                  maxLength={80}
                />
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(e) =>
                    setForm((c) => ({ ...c, authorName: e.target.value }))
                  }
                  placeholder="Your name (optional)"
                  value={form.authorName}
                  maxLength={60}
                />
              </div>

              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  className="rounded-lg border border-border px-4 py-2 text-sm"
                  onClick={() => setIsFormOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                  onClick={() => void submitNote()}
                  type="button"
                >
                  {submitting ? "Posting..." : "Post Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
