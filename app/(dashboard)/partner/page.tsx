"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dumbbell,
  BookOpen,
  Users,
  Plus,
  Heart,
  Mountain,
  ChefHat,
  X,
} from "lucide-react";

type Listing = {
  id: number;
  activity: string;
  seeking: "partner" | "group";
  description: string;
  time: string;
  location: string;
  name: string;
  contact: string;
  maxParticipants: number;
  participants: string[];
  currentParticipants: number;
  createdAt: string;
};

const activityIcons: Record<string, typeof Dumbbell> = {
  "Gym Partner": Dumbbell,
  "Study Partner": BookOpen,
  "Study Group": BookOpen,
  Basketball: Users,
  "Running Partner": Users,
  "Language Exchange": Users,
  "Yoga Sessions": Heart,
  "Hiking Group": Mountain,
  "Cooking Club": ChefHat,
};

function formatPosted(iso: string): string {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

export default function PartnerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeFilter, setActiveFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  const [joinMode, setJoinMode] = useState<"join" | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);
  // Per-browser tracking of which listing ids the current user has joined,
  // and what name they joined as. Stored only client-side — no auth model exists.
  const [joinedMap, setJoinedMap] = useState<Record<number, string>>({});

  const [formData, setFormData] = useState({
    activity: "",
    seeking: "partner" as "partner" | "group",
    description: "",
    time: "",
    location: "",
    name: "",
    contact: "",
    maxParticipants: 2,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch listings from DB on mount ──────────────────────────────────────
  const fetchListings = useCallback(async () => {
    try {
      setLoadError("");
      const res = await fetch("/api/partners", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load partner listings.");
      const payload = (await res.json()) as { listings: Listing[] };
      setListings(payload.listings);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  // Hydrate joinedMap from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("partnerJoinedMap");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") setJoinedMap(parsed);
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("partnerJoinedMap", JSON.stringify(joinedMap));
    } catch {
      // quota / disabled — ignore
    }
  }, [joinedMap, mounted]);

  // ── Filtering ───────────────────────────────────────────────────────────
  const getFiltered = () => {
    if (activeFilter === "All") return listings;
    if (activeFilter === "Partner") return listings.filter((i) => i.seeking === "partner");
    if (activeFilter === "Group") return listings.filter((i) => i.seeking === "group");
    if (activeFilter === "Gym") return listings.filter((i) => i.activity.toLowerCase().includes("gym"));
    if (activeFilter === "Study") return listings.filter((i) => i.activity.toLowerCase().includes("study"));
    if (activeFilter === "Sports") {
      return listings.filter((i) => {
        const a = i.activity.toLowerCase();
        return (
          a.includes("basketball") ||
          a.includes("running") ||
          a.includes("hiking") ||
          a.includes("soccer") ||
          a.includes("climbing") ||
          a.includes("cycling")
        );
      });
    }
    if (activeFilter === "Clubs") {
      return listings.filter((i) => {
        const a = i.activity.toLowerCase();
        return a.includes("club") || a.includes("exchange") || a.includes("sessions");
      });
    }
    if (activeFilter === "Other") {
      return listings.filter((i) => {
        const a = i.activity.toLowerCase();
        return !(
          a.includes("gym") ||
          a.includes("study") ||
          a.includes("basketball") ||
          a.includes("running") ||
          a.includes("hiking") ||
          a.includes("yoga") ||
          a.includes("language") ||
          a.includes("cooking") ||
          a.includes("club") ||
          a.includes("exchange") ||
          a.includes("sessions") ||
          a.includes("soccer") ||
          a.includes("climbing") ||
          a.includes("cycling")
        );
      });
    }
    return listings;
  };
  const filtered = getFiltered();

  // ── Form helpers ────────────────────────────────────────────────────────
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "seeking") {
        if (value === "group" && prev.maxParticipants < 2) next.maxParticipants = 4;
        if (value === "partner") next.maxParticipants = 2;
      }
      if (field === "maxParticipants") {
        next.maxParticipants = Number(value) || 2;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: formData.activity,
          seeking: formData.seeking,
          description: formData.description,
          time: formData.time,
          location: formData.location,
          name: formData.name,
          contact: formData.contact,
          maxParticipants:
            formData.seeking === "partner" ? 2 : Math.max(2, Number(formData.maxParticipants)),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not post listing.");
      }
      await fetchListings();
      setFormData({
        activity: "",
        seeking: "partner",
        description: "",
        time: "",
        location: "",
        name: "",
        contact: "",
        maxParticipants: 2,
      });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not post listing.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Modal helpers ───────────────────────────────────────────────────────
  const closeModal = () => {
    setSelectedListing(null);
    setJoinMode(null);
    setJoinName("");
    setJoinError("");
  };

  const handleJoinConfirm = async () => {
    if (!selectedListing) return;
    const name = joinName.trim();
    if (!name) {
      setJoinError("Please enter your name.");
      return;
    }

    setJoinError("");
    setJoinSubmitting(true);
    try {
      const res = await fetch(`/api/partners/${selectedListing.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinerName: name }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not join listing.");
      }
      const updated = (await res.json()) as {
        participants: string[];
        currentParticipants: number;
        maxParticipants: number;
      };

      // Patch listings + selectedListing in place
      setListings((curr) =>
        curr.map((l) => (l.id === selectedListing.id ? { ...l, ...updated } : l)),
      );
      setSelectedListing((curr) => (curr ? { ...curr, ...updated } : curr));
      setJoinedMap((m) => ({ ...m, [selectedListing.id]: name }));
      setJoinMode(null);
      setJoinName("");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not join listing.");
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (!selectedListing) return;
    const joinedAs = joinedMap[selectedListing.id];
    if (!joinedAs) return;

    try {
      const res = await fetch(`/api/partners/${selectedListing.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinerName: joinedAs }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not leave listing.");
      }
      const updated = (await res.json()) as {
        participants: string[];
        currentParticipants: number;
        maxParticipants: number;
      };

      setListings((curr) =>
        curr.map((l) => (l.id === selectedListing.id ? { ...l, ...updated } : l)),
      );
      setJoinedMap((m) => {
        const next = { ...m };
        delete next[selectedListing.id];
        return next;
      });
      closeModal();
    } catch {
      // surface as join error so the existing form area shows it
      setJoinError("Could not leave the listing.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Find Partners & Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect with fellow students for activities around campus. Find gym buddies, study partners, or join group activities.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Post Listing
        </button>
      </div>

      {/* Activity filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "Partner", "Group", "Gym", "Study", "Sports", "Clubs", "Other"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              filter === activeFilter
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-card-foreground hover:bg-accent"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loadError ? (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading listings...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No listings match this filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const Icon = activityIcons[item.activity] ?? Users;
            const slotsLeft = Math.max(0, item.maxParticipants - item.currentParticipants);
            const hasJoined = !!joinedMap[item.id];

            return (
              <div
                key={item.id}
                className="flex flex-col rounded-lg border border-border bg-card p-5 transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
                onClick={() => setSelectedListing(item)}
              >
                <div className="mb-4 flex h-16 items-center justify-center rounded-md bg-secondary/50">
                  <Icon className="h-8 w-8 text-muted-foreground/50" />
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.activity}</span>
                    <div className="flex items-center gap-2">
                      {mounted ? (
                        hasJoined ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            You joined
                          </span>
                        ) : slotsLeft === 0 ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Full
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
                          </span>
                        )
                      ) : null}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.seeking === "partner"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {item.seeking === "partner" ? "Partner" : "Group"}
                      </span>
                    </div>
                  </div>
                  <h3 className="mb-2 font-medium leading-snug">{item.name}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">{item.description}</p>
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">🕒 {item.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">📍 {item.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.contact}</span>
                    <span>{formatPosted(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partner Up Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Partner Up</h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/50">
                  {React.createElement(activityIcons[selectedListing.activity] ?? Users, {
                    className: "h-6 w-6 text-muted-foreground/50",
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{selectedListing.activity}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        selectedListing.seeking === "partner"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {selectedListing.seeking === "partner" ? "Partner" : "Group"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{selectedListing.description}</p>

                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">👥</span>
                      <span className="font-semibold text-primary">Current Participants</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {selectedListing.participants.length} joined
                      </span>
                      {selectedListing.maxParticipants - selectedListing.currentParticipants <= 0 ? (
                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full">
                          Full
                        </span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded-full">
                          {selectedListing.maxParticipants - selectedListing.currentParticipants} slot
                          {selectedListing.maxParticipants - selectedListing.currentParticipants !== 1 ? "s" : ""} left
                        </span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed text-foreground">
                      {selectedListing.participants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedListing.participants.map((p, i) => (
                            <button
                              key={`${p}-${i}`}
                              onClick={() => setSelectedParticipant(p)}
                              className="text-primary hover:underline font-medium"
                            >
                              {p}
                              {i < selectedListing.participants.length - 1 ? "," : ""}
                            </button>
                          ))}
                        </div>
                      ) : (
                        "No participants yet"
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">👤</span>
                      <span>{selectedListing.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">📧</span>
                      <span>{selectedListing.contact}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                {joinMode && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Enter your name to join:</p>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={joinName}
                        onChange={(e) => {
                          setJoinName(e.target.value);
                          setJoinError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleJoinConfirm()}
                        className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Your name"
                      />
                      <button
                        onClick={handleJoinConfirm}
                        disabled={!joinName.trim() || joinSubmitting}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                      >
                        {joinSubmitting ? "..." : "Confirm"}
                      </button>
                    </div>
                    {joinError && <p className="text-xs text-red-500">{joinError}</p>}
                    <button
                      onClick={() => {
                        setJoinMode(null);
                        setJoinName("");
                        setJoinError("");
                      }}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {!joinMode &&
                  (mounted ? (
                    joinedMap[selectedListing.id] ? (
                      <div className="space-y-3">
                        <div className="rounded-md bg-green-600/10 border border-green-600/30 px-4 py-3 space-y-1">
                          <p className="text-green-600 font-semibold text-sm">✓ You&apos;ve joined!</p>
                          <p className="text-xs text-muted-foreground">
                            Contact <span className="font-medium text-foreground">{selectedListing.name}</span> at{" "}
                            <a
                              href={`mailto:${selectedListing.contact}`}
                              className="text-primary hover:underline"
                            >
                              {selectedListing.contact}
                            </a>{" "}
                            to coordinate.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={closeModal}
                            className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                          >
                            Close
                          </button>
                          <button
                            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            onClick={handleLeave}
                          >
                            Leave Group
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={closeModal}
                          className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                        >
                          Close
                        </button>
                        {selectedListing.maxParticipants - selectedListing.currentParticipants <= 0 ? (
                          <button
                            className="flex-1 rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white"
                            disabled
                          >
                            Full
                          </button>
                        ) : (
                          <button
                            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            onClick={() => {
                              setJoinMode("join");
                              setJoinName("");
                              setJoinError("");
                            }}
                          >
                            {selectedListing.seeking === "partner" ? "Partner Up" : "Join Group"}
                          </button>
                        )}
                      </div>
                    )
                  ) : null)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participant Info Popup */}
      {selectedParticipant && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Participant Info</h2>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="rounded-full p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <h3 className="font-medium">{selectedParticipant}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedParticipant === selectedListing.name ? "Organizer" : "Participant"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">📧</span>
                  {selectedParticipant === selectedListing.name ? (
                    <a
                      href={`mailto:${selectedListing.contact}`}
                      className="text-primary hover:underline"
                    >
                      {selectedListing.contact}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">
                      No contact info — reach out via the organizer
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">🎯</span>
                  <span>
                    {selectedParticipant === selectedListing.name
                      ? `Organising ${selectedListing.activity}`
                      : `Joined ${selectedListing.activity}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">📍</span>
                  <span>{selectedListing.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">🕒</span>
                  <span>{selectedListing.time}</span>
                </div>
              </div>

              {selectedParticipant !== selectedListing.name && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    To coordinate, contact the organiser{" "}
                    <span className="font-medium text-foreground">{selectedListing.name}</span> at{" "}
                    <a href={`mailto:${selectedListing.contact}`} className="text-primary hover:underline">
                      {selectedListing.contact}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Listing Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Post a Partner Listing</h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Activity</label>
                <select
                  value={formData.activity}
                  onChange={(e) => handleInputChange("activity", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select an activity</option>
                  <option value="Gym Partner">Gym Partner</option>
                  <option value="Study Partner">Study Partner</option>
                  <option value="Study Group">Study Group</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Running Partner">Running Partner</option>
                  <option value="Language Exchange">Language Exchange</option>
                  <option value="Yoga Sessions">Yoga Sessions</option>
                  <option value="Hiking Group">Hiking Group</option>
                  <option value="Cooking Club">Cooking Club</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Looking for</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="seeking"
                      value="partner"
                      checked={formData.seeking === "partner"}
                      onChange={(e) => handleInputChange("seeking", e.target.value)}
                    />
                    <span className="text-sm">Partner (1-on-1)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="seeking"
                      value="group"
                      checked={formData.seeking === "group"}
                      onChange={(e) => handleInputChange("seeking", e.target.value)}
                    />
                    <span className="text-sm">Group</span>
                  </label>
                </div>
              </div>

              {formData.seeking === "group" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Group Size (including you)</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="How many people total?"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 2 people for groups</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Describe what you're looking for..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Weekdays 6-8 PM"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g., NYU Palladium Fitness Center"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact (email or phone)</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => handleInputChange("contact", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="netid@nyu.edu"
                  required
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? "Posting..." : "Post Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
