"use client";

import { useState } from "react";
import { X, MapPinPlus } from "lucide-react";
import type { StudySpace, NoiseLevel, SpaceType } from "./types";

interface Props {
  onSubmit: (space: StudySpace) => void;
  onClose: () => void;
}

const NOISE_OPTIONS: { value: NoiseLevel; label: string }[] = [
  { value: "silent", label: "Silent" },
  { value: "quiet", label: "Quiet" },
  { value: "moderate", label: "Moderate" },
  { value: "loud", label: "Loud" },
];

const AMENITY_OPTIONS = [
  "Wi-Fi",
  "Power Outlets",
  "Whiteboards",
  "Natural Light",
  "Enclosed",
  "Food Nearby",
  "Couches",
  "Monitor Hookups",
  "Printers",
  "Vending Machines",
  "Zoom-Friendly",
  "Fresh Air",
];

export default function SubmitSpotModal({ onSubmit, onClose }: Props) {
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [address, setAddress] = useState("");
  const [floor, setFloor] = useState("");
  const [noise, setNoise] = useState<NoiseLevel>("quiet");
  const [hours, setHours] = useState("");
  const [capacity, setCapacity] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [tip, setTip] = useState("");

  function toggleAmenity(a: string) {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newSpace: StudySpace = {
      id: `gem-${Date.now()}`,
      name,
      building,
      address,
      floor,
      latitude: 40.73 + (Math.random() - 0.5) * 0.005,
      longitude: -73.997 + (Math.random() - 0.5) * 0.005,
      noise,
      type: "hidden_gem",
      amenities,
      hours: hours || "Unknown",
      capacity: capacity || "Unknown",
      checkins: 0,
      tip: tip || undefined,
      favorite: false,
      submittedBy: "You",
    };

    onSubmit(newSpace);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4 rounded-t-xl">
          <div className="flex items-center gap-2">
            <MapPinPlus className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold">Submit a Hidden Gem</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Spot name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. GCASL 6th Floor Empty Classrooms"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Building + Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Building *
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                required
                placeholder="e.g. GCASL"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Floor *
              </label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                required
                placeholder="e.g. 6th Floor"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 238 Thompson Street"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Noise level */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Noise level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {NOISE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNoise(opt.value)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                    noise === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hours + Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Hours</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 8 AM – 10 PM"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Capacity
              </label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. ~20 seats"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    amenities.includes(a)
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Student tip */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Pro tip{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <textarea
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              rows={2}
              placeholder="Any insider info for fellow students..."
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !building.trim() || !floor.trim()}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit Spot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
