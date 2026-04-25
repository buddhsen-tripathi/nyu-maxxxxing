"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import type { StudySpace, NoiseLevel } from "./types";

// ─── Theme-aware tiles ──────────────────────────────────────────────────────

const TILES = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
};

function useTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    function check() {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    }
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  return theme;
}

// ─── Marker helpers ─────────────────────────────────────────────────────────

const NOISE_COLOR: Record<NoiseLevel, string> = {
  silent: "#818cf8", // indigo-400
  quiet: "#60a5fa", // blue-400
  moderate: "#4ade80", // green-400
  loud: "#fbbf24", // amber-400
};

const NOISE_LABEL: Record<NoiseLevel, string> = {
  silent: "Silent",
  quiet: "Quiet",
  moderate: "Moderate",
  loud: "Loud",
};

function makePinIcon(
  noise: NoiseLevel,
  isGem: boolean,
  checkins: number
): L.DivIcon {
  const fill = NOISE_COLOR[noise];
  const gemBadge = isGem
    ? `<div style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;
         background:#a855f7;border:2px solid rgba(0,0,0,0.3);border-radius:50%;display:flex;
         align-items:center;justify-content:center;font-size:9px;color:white;font-weight:bold;">★</div>`
    : "";
  const pulse =
    checkins > 5
      ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
           width:40px;height:40px;border-radius:50%;background:${fill};opacity:0.25;
           animation:pulse-ring 2s ease-out infinite;"></div>`
      : "";

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:inline-block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
      ${pulse}
      <svg width="30" height="44" viewBox="0 0 30 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.72 0 0 6.72 0 15C0 26.25 15 44 15 44C15 44 30 26.25 30 15C30 6.72 23.28 0 15 0Z"
              fill="${fill}" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
        <circle cx="15" cy="15" r="6" fill="white" opacity="0.95"/>
      </svg>
      ${gemBadge}
    </div>`,
    iconSize: [30, 44],
    iconAnchor: [15, 44],
    popupAnchor: [0, -46],
  });
}

// ─── Bounds restrictor ──────────────────────────────────────────────────────

const NYC_BOUNDS = L.latLngBounds(
  [40.48, -74.28],
  [40.92, -73.68]
);

function BoundsRestrictor() {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(NYC_BOUNDS);
    map.setMinZoom(11);
    map.setMaxZoom(18);
    map.on("drag", () => {
      map.panInsideBounds(NYC_BOUNDS, { animate: false });
    });
  }, [map]);

  return null;
}

// ─── Inject pulse animation ─────────────────────────────────────────────────

function PulseStyle() {
  useEffect(() => {
    const id = "spaces-map-pulse";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes pulse-ring {
        0% { transform: translate(-50%,-50%) scale(0.5); opacity: 0.4; }
        100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  spaces: StudySpace[];
  onCheckin: (spaceId: string) => void;
  onCheckout: (spaceId: string) => void;
  onToggleFavorite: (spaceId: string) => void;
}

const MAP_CENTER: [number, number] = [40.7295, -73.9975];
const MAP_ZOOM = 16;

export default function SpacesMap({
  spaces,
  onCheckin,
  onCheckout,
  onToggleFavorite,
}: Props) {
  const theme = useTheme();
  const tile = TILES[theme];

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      scrollWheelZoom
      className="h-full w-full rounded-xl"
    >
      <BoundsRestrictor />
      <PulseStyle />

      <TileLayer
        key={theme}
        attribution={tile.attribution}
        url={tile.url}
      />

      {spaces.map((space) => {
        const icon = makePinIcon(
          space.noise,
          space.type === "hidden_gem",
          space.checkins
        );

        return (
          <Marker
            key={space.id}
            position={[space.latitude, space.longitude]}
            icon={icon}
          >
            <Popup minWidth={230} maxWidth={270}>
              <PopupCard
                space={space}
                onCheckin={() => onCheckin(space.id)}
                onCheckout={() => onCheckout(space.id)}
                onToggleFavorite={() => onToggleFavorite(space.id)}
              />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

// ─── Popup card ─────────────────────────────────────────────────────────────

function PopupCard({
  space,
  onCheckin,
  onCheckout,
  onToggleFavorite,
}: {
  space: StudySpace;
  onCheckin: () => void;
  onCheckout: () => void;
  onToggleFavorite: () => void;
}) {
  const noiseColor = NOISE_COLOR[space.noise];

  return (
    <div style={{ fontFamily: "inherit", minWidth: 210 }}>
      {/* Name + gem badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 2px", color: "#111827" }}>
            {space.name}
          </p>
          <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 6px" }}>
            {space.address} · {space.floor}
          </p>
        </div>
        {space.type === "hidden_gem" && (
          <span style={{
            background: "#f3e8ff", color: "#7c3aed", fontSize: 10,
            fontWeight: 600, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap",
          }}>
            Hidden Gem
          </span>
        )}
      </div>

      {/* Noise + busyness row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "2px 8px", borderRadius: 99,
          background: noiseColor + "22", border: `1px solid ${noiseColor}55`,
          fontSize: 11, fontWeight: 500, color: noiseColor,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: noiseColor }} />
          {NOISE_LABEL[space.noise]}
        </span>
        {space.checkins > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 99,
            background: space.checkins > 10 ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${space.checkins > 10 ? "#fecaca" : "#bbf7d0"}`,
            fontSize: 11, fontWeight: 500,
            color: space.checkins > 10 ? "#dc2626" : "#16a34a",
          }}>
            {space.checkins > 10 ? "🔥 Busy" : `👥 ${space.checkins} here`}
          </span>
        )}
        <span style={{ fontSize: 11, color: "#6b7280" }}>{space.capacity}</span>
      </div>

      {/* Hours */}
      <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 6px" }}>
        🕐 {space.hours}
      </p>

      {/* Amenities */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
        {space.amenities.map((a) => (
          <span key={a} style={{
            fontSize: 10, background: "#f3f4f6", color: "#374151",
            padding: "2px 6px", borderRadius: 4,
          }}>
            {a}
          </span>
        ))}
      </div>

      {/* Student tip */}
      {space.tip && (
        <div style={{
          background: "#fefce8", border: "1px solid #fef08a", borderRadius: 6,
          padding: "5px 8px", fontSize: 11, color: "#854d0e",
          marginBottom: 8, lineHeight: 1.4, fontStyle: "italic",
        }}>
          💡 "{space.tip}"
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onCheckin}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 5, padding: "7px 0", borderRadius: 8,
            background: "#7c3aed", color: "white",
            fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
          }}
          onMouseOver={(e) => ((e.target as HTMLButtonElement).style.background = "#6d28d9")}
          onMouseOut={(e) => ((e.target as HTMLButtonElement).style.background = "#7c3aed")}
        >
          📍 I'm Here
        </button>
        <button
          onClick={onCheckout}
          disabled={space.checkins === 0}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 5, padding: "7px 0", borderRadius: 8,
            background: "#f9fafb", color: space.checkins === 0 ? "#cbd5e1" : "#374151",
            fontSize: 12, fontWeight: 600,
            border: "1px solid #e5e7eb",
            cursor: space.checkins === 0 ? "not-allowed" : "pointer",
            opacity: space.checkins === 0 ? 0.5 : 1,
          }}
          onMouseOver={(e) => {
            if (space.checkins !== 0)
              (e.target as HTMLButtonElement).style.background = "#f3f4f6";
          }}
          onMouseOut={(e) => ((e.target as HTMLButtonElement).style.background = "#f9fafb")}
          title={space.checkins === 0 ? "No one checked in yet" : "Check out"}
        >
          👋 I'm Out
        </button>
        <button
          onClick={onToggleFavorite}
          style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8,
            background: space.favorite ? "#fef2f2" : "#f9fafb",
            border: `1px solid ${space.favorite ? "#fca5a5" : "#e5e7eb"}`,
            cursor: "pointer", color: space.favorite ? "#ef4444" : "#9ca3af", fontSize: 16,
          }}
          title={space.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          {space.favorite ? "♥" : "♡"}
        </button>
      </div>

      {/* Book / availability link */}
      {space.bookingUrl && (
        <a
          href={space.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 5, padding: "7px 0", marginTop: 6, borderRadius: 8,
            background: "#fff", color: "#7c3aed", textDecoration: "none",
            fontSize: 12, fontWeight: 600,
            border: "1px solid #c4b5fd", cursor: "pointer",
          }}
          onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f5f3ff")}
          onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#fff")}
        >
          📅 Book / Check Availability →
        </a>
      )}

      {/* Submitted by */}
      {space.submittedBy && (
        <p style={{ fontSize: 10, color: "#a78bfa", marginTop: 6, textAlign: "center" }}>
          Submitted by {space.submittedBy}
        </p>
      )}
    </div>
  );
}
