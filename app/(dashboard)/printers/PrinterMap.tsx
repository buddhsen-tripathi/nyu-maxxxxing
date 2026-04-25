"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Printer, PrinterStatus } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STALE_HOURS = 48;

export function isStale(isoString: string): boolean {
  return Date.now() - new Date(isoString).getTime() > STALE_HOURS * 3_600_000;
}

export function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

// Status: NYU purple = working, red = broken, amber = unknown
const STATUS_RING: Record<PrinterStatus, string> = {
  working: "#22c55e",
  not_working: "#ef4444",
  unknown: "#f59e0b",
};

const STATUS_LABEL: Record<PrinterStatus, string> = {
  working: "Working",
  not_working: "Not Working",
  unknown: "Unknown",
};

// ─── NYU Torch Marker ────────────────────────────────────────────────────────
// Resembles the real NYU flag: purple background → white square → purple torch.
// A small status dot (green/red/amber) sits bottom-right to indicate live status.

function makeNYUMarker(status: PrinterStatus, stale: boolean): L.DivIcon {
  const dotColor = stale && status !== "not_working"
    ? "#f97316"          // orange = needs verification
    : STATUS_RING[status];

  const torchSvg = `
    <svg width="44" height="58" viewBox="0 0 44 58" xmlns="http://www.w3.org/2000/svg">
      <!-- Pin body: NYU purple teardrop -->
      <path d="M22 0C9.85 0 0 9.85 0 22C0 38.5 22 58 22 58C22 58 44 38.5 44 22C44 9.85 34.15 0 22 0Z"
            fill="#57068C" stroke="white" stroke-width="1.8"/>

      <!-- White inset square (like the white panel on the NYU flag) -->
      <rect x="8" y="6" width="28" height="28" rx="3" fill="white"/>

      <!-- ── NYU Torch in purple on white ── -->
      <!-- Left outer flame -->
      <path d="M15,11 C12,13.5 12,17.5 14.5,18.5 C14.5,16 15,14 15,11Z" fill="#57068C" opacity="0.75"/>
      <!-- Right outer flame -->
      <path d="M29,11 C32,13.5 32,17.5 29.5,18.5 C29.5,16 29,14 29,11Z" fill="#57068C" opacity="0.75"/>
      <!-- Center main flame -->
      <path d="M22,8 C24.5,10.5 25.5,14 23.5,17.5
               C22.8,15.5 22.5,14 22,17
               C21.5,14 21.2,15.5 20.5,17.5
               C18.5,14 19.5,10.5 22,8Z" fill="#57068C"/>
      <!-- Torch cup (wider receptacle) -->
      <path d="M15.5,18.5 L16.5,22 L27.5,22 L28.5,18.5Z" fill="#57068C"/>
      <!-- Torch handle -->
      <rect x="20" y="22" width="4" height="8" rx="1" fill="#57068C"/>
      <!-- Torch base cap -->
      <rect x="17.5" y="30" width="9" height="2" rx="1" fill="#57068C"/>

      <!-- Status dot — bottom-right corner of white square -->
      <circle cx="34" cy="32" r="5.5" fill="${dotColor}" stroke="white" stroke-width="1.5"/>
    </svg>`;

  const stalePulse = stale
    ? `<div style="position:absolute;top:0;right:0;width:44px;height:58px;pointer-events:none;">
         <div style="position:absolute;top:26px;right:1px;width:11px;height:11px;
                     border-radius:50%;background:${dotColor};opacity:0.4;
                     animation:pulse 1.6s infinite;"></div>
       </div>`
    : "";

  return L.divIcon({
    className: "",
    html: `
      <style>
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.8);opacity:0} }
      </style>
      <div style="position:relative;display:inline-block;
                  filter:drop-shadow(0 3px 5px rgba(0,0,0,0.4))">
        ${torchSvg}
        ${stalePulse}
      </div>`,
    iconSize: [44, 58],
    iconAnchor: [22, 58],
    popupAnchor: [0, -62],
  });
}

// ─── MapController: flies to a target when search finds a match ───────────────

function MapController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 17, { animate: true, duration: 1.2 });
    }
  }, [map, target]);
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  printers: Printer[];
  flyTarget: [number, number] | null;
  onReportStatus: (printerId: string) => void;
}

const MAP_CENTER: [number, number] = [40.718, -73.993];
const MAP_ZOOM = 13;

export default function PrinterMap({ printers, flyTarget, onReportStatus }: Props) {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      scrollWheelZoom
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Pan + zoom to search result */}
      <MapController target={flyTarget} />

      {/* Cluster nearby markers when zoomed out */}
      <MarkerClusterGroup chunkedLoading>
        {printers.map((printer) => {
          const stale = isStale(printer.last_updated);
          return (
            <Marker
              key={printer.id}
              position={[printer.latitude, printer.longitude]}
              icon={makeNYUMarker(printer.status, stale)}
            >
              <Popup minWidth={215} maxWidth={260}>
                <PopupCard
                  printer={printer}
                  stale={stale}
                  onReport={() => onReportStatus(printer.id)}
                />
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

// ─── Popup card ───────────────────────────────────────────────────────────────

function PopupCard({
  printer,
  stale,
  onReport,
}: {
  printer: Printer;
  stale: boolean;
  onReport: () => void;
}) {
  const dotColor = STATUS_RING[printer.status];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", minWidth: 205 }}>
      {/* NYU branding strip */}
      <div style={{
        background: "#57068C", color: "white", fontWeight: 700,
        fontSize: 11, padding: "4px 8px", borderRadius: "4px 4px 0 0",
        marginBottom: 8, letterSpacing: "0.5px",
      }}>
        NYU Print Station
      </div>

      <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px", color: "#1a1a1a" }}>
        {printer.name}
      </p>
      <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px" }}>
        {printer.building} · {printer.floor}
      </p>

      {/* Status badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 9px", borderRadius: 99,
        background: dotColor + "18", border: `1px solid ${dotColor}55`,
        fontSize: 12, fontWeight: 600, color: dotColor, marginBottom: 7,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
        {STATUS_LABEL[printer.status]}
      </div>

      {/* Stale warning */}
      {stale && (
        <div style={{
          display: "flex", gap: 5, alignItems: "flex-start",
          padding: "4px 8px", borderRadius: 6,
          background: "#fff7ed", border: "1px solid #fed7aa",
          fontSize: 11, color: "#c2410c", marginBottom: 7,
        }}>
          <span>⚠️</span>
          <span>Not verified since {getRelativeTime(printer.last_updated)} — needs a check</span>
        </div>
      )}

      {!stale && (
        <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 3px" }}>
          Updated {getRelativeTime(printer.last_updated)}
          {printer.last_reported_by ? ` · by ${printer.last_reported_by}` : ""}
        </p>
      )}

      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
        {printer.printer_type}
      </p>

      <button
        onClick={onReport}
        style={{
          width: "100%", padding: "7px 0", borderRadius: 7,
          background: "#57068C", color: "white",
          fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
          letterSpacing: "0.3px",
        }}
        onMouseOver={(e) => ((e.target as HTMLButtonElement).style.background = "#3d0563")}
        onMouseOut={(e) => ((e.target as HTMLButtonElement).style.background = "#57068C")}
      >
        Report Status
      </button>
    </div>
  );
}
