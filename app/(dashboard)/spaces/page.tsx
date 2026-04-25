"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import {
  MapPin,
  Volume2,
  Clock,
  Users,
  Heart,
  MapPinPlus,
  Star,
  CalendarCheck,
} from "lucide-react";

import { initialSpaces } from "./spacesData";
import SubmitSpotModal from "./SubmitSpotModal";
import { useUserContext } from "../chat-context";
import type { StudySpace, SpaceFilter } from "./types";

const SpacesMap = dynamic(() => import("./SpacesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-accent/30 text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
});

// ─── Noise badge colors ────────────────────────────────────────────────────

const NOISE_STYLE: Record<string, string> = {
  silent:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800",
  quiet:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  moderate:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
  loud: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
};

// ─── Page component ─────────────────────────────────────────────────────────

export default function SpacesPage() {
  const [rawSpaces, setRawSpaces] = useState<StudySpace[]>(initialSpaces);
  const [filter, setFilter] = useState<SpaceFilter>("all");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Favorites + check-in tracking persist across navigations / reloads via context
  const { favoriteSpaces, toggleFavoriteSpace, recordCheckin } = useUserContext();

  // Overlay context favorites onto the in-memory spaces so map/list see the right heart state
  const spaces = useMemo(
    () =>
      rawSpaces.map((s) => ({
        ...s,
        favorite: favoriteSpaces.includes(s.id),
      })),
    [rawSpaces, favoriteSpaces]
  );

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    switch (filter) {
      case "quiet":
        return spaces.filter(
          (s) => s.noise === "silent" || s.noise === "quiet"
        );
      case "group":
        return spaces.filter(
          (s) =>
            s.amenities.some((a) =>
              ["Whiteboards", "Monitor Hookups", "Couches"].includes(a)
            ) || s.noise === "moderate"
        );
      case "zoom":
        return spaces.filter(
          (s) =>
            s.amenities.includes("Zoom-Friendly") ||
            s.amenities.includes("Enclosed") ||
            s.amenities.includes("AV Booths")
        );
      case "outdoor":
        return spaces.filter((s) => s.type === "outdoor");
      case "hidden_gems":
        return spaces.filter((s) => s.type === "hidden_gem");
      case "favorites":
        return spaces.filter((s) => s.favorite);
      default:
        return spaces;
    }
  }, [spaces, filter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleCheckin(id: string) {
    setRawSpaces((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checkins: s.checkins + 1 } : s))
    );
    recordCheckin(id);
  }

  function handleCheckout(id: string) {
    setRawSpaces((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, checkins: Math.max(0, s.checkins - 1) } : s
      )
    );
  }

  function handleToggleFavorite(id: string) {
    toggleFavoriteSpace(id);
  }

  function handleSubmitSpot(spot: StudySpace) {
    setRawSpaces((prev) => [spot, ...prev]);
    setShowSubmitModal(false);
  }

  // ── Counts ────────────────────────────────────────────────────────────────
  const favCount = favoriteSpaces.length;
  const gemCount = spaces.filter((s) => s.type === "hidden_gem").length;
  const totalCheckins = spaces.reduce((sum, s) => sum + s.checkins, 0);

  const filters: { key: SpaceFilter; label: string }[] = [
    { key: "all", label: `All (${spaces.length})` },
    { key: "quiet", label: "Quiet / Silent" },
    { key: "group", label: "Group Work" },
    { key: "zoom", label: "Zoom-Friendly" },
    { key: "outdoor", label: "Outdoor" },
    { key: "hidden_gems", label: `Hidden Gems (${gemCount})` },
    { key: "favorites", label: `Favorites (${favCount})` },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold">Find Your Space</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover study spots across NYU. Check in, share hidden gems, and
            save your favorites.
          </p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          <MapPinPlus className="h-4 w-4" />
          Submit a Spot
        </button>
      </div>

      {/* Filter bar + stats */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {totalCheckins} checked in
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-purple-500" />
            {gemCount} hidden gems
          </span>
        </div>
      </div>

      {/* Map + list split */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Map */}
        <div className="flex-1 min-h-[400px]">
          <SpacesMap
            spaces={filtered}
            onCheckin={handleCheckin}
            onCheckout={handleCheckout}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>

        {/* Side list */}
        <div className="hidden w-80 shrink-0 overflow-y-auto lg:block">
          <div className="space-y-3">
            {filtered.map((space) => (
              <div
                key={space.id}
                className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-medium">
                        {space.name}
                      </h3>
                      {space.type === "hidden_gem" && (
                        <Star className="h-3.5 w-3.5 shrink-0 text-purple-500 fill-purple-500" />
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{space.address}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(space.id)}
                    className="shrink-0 p-0.5"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        space.favorite
                          ? "fill-red-500 text-red-500"
                          : "text-muted-foreground/40 hover:text-red-400"
                      }`}
                    />
                  </button>
                </div>

                {/* Badges */}
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${NOISE_STYLE[space.noise]}`}
                  >
                    {space.noise.charAt(0).toUpperCase() + space.noise.slice(1)}
                  </span>
                  {space.amenities.slice(0, 2).map((a) => (
                    <span
                      key={a}
                      className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {space.hours}
                  </span>
                  {space.checkins > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {space.checkins} here
                    </span>
                  )}
                </div>

                {/* Check-in / Check-out buttons */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleCheckin(space.id)}
                    className="flex-1 rounded-md bg-purple-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    I'm Here 📍
                  </button>
                  <button
                    onClick={() => handleCheckout(space.id)}
                    disabled={space.checkins === 0}
                    className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    I'm Out 👋
                  </button>
                </div>

                {/* Book / availability link */}
                {space.bookingUrl && (
                  <a
                    href={space.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-md border border-purple-300 bg-purple-50 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Book / Check Availability
                  </a>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No spaces match this filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend (below map on small screens) */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span className="font-medium text-foreground">Noise:</span>
        {[
          { color: "bg-indigo-500", label: "Silent" },
          { color: "bg-blue-500", label: "Quiet" },
          { color: "bg-green-500", label: "Moderate" },
          { color: "bg-amber-500", label: "Loud" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-purple-500 text-purple-500" />
          Hidden Gem
        </span>
      </div>

      {/* Submit modal */}
      {showSubmitModal && (
        <SubmitSpotModal
          onSubmit={handleSubmitSpot}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
}
