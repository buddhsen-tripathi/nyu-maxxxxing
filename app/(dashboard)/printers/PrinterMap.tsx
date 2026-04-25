"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Printer, PrinterStatus } from "./types";

// ─── Helpers (also exported for use in page.tsx) ─────────────────────────────

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

// NYU brand purple for working; red/amber for other statuses
const STATUS_FILL: Record<PrinterStatus, string> = {
  working: "#57068C",   // NYU Purple
  not_working: "#dc2626",
  unknown: "#d97706",
};

const STATUS_LABEL: Record<PrinterStatus, string> = {
  working: "Working",
  not_working: "Not Working",
  unknown: "Unknown",
};

// NYU flag-style marker: pole on left, rectangular flag body, status color,
// white "P" initial inside. Orange dot when printer is stale (>48 h).
function makeFlagIcon(status: PrinterStatus, stale: boolean): L.DivIcon {
  const fill = STATUS_FILL[status];
  const staleDot = stale
    ? `<div style="position:absolute;top:-4px;right:-4px;width:11px;height:11px;
         background:#f97316;border:2px solid white;border-radius:50%;z-index:2;"></div>`
    : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:inline-block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">
        <svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
          <!-- Pole -->
          <rect x="2" y="0" width="3" height="44" rx="1.5" fill="${fill}"/>
          <!-- Flag body -->
          <rect x="5" y="1" width="28" height="21" rx="2" fill="${fill}"/>
          <!-- White "P" for Printer -->
          <text x="19" y="16" text-anchor="middle" fill="white"
                font-weight="700" font-size="13"
                font-family="Montserrat,Arial,sans-serif">P</text>
          <!-- Ground anchor dot -->
          <circle cx="3.5" cy="45" r="2.5" fill="${fill}"/>
        </svg>
        ${staleDot}
      </div>`,
    iconSize: [34, 46],
    iconAnchor: [3, 46],    // anchor at the pole base
    popupAnchor: [14, -48], // popup opens above the flag
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  printers: Printer[];
  onReportStatus: (printerId: string) => void;
}

// Center chosen to show both the Brooklyn Tandon campus and WSQ Manhattan campus
const MAP_CENTER: [number, number] = [40.718, -73.993];
const MAP_ZOOM = 13;

export default function PrinterMap({ printers, onReportStatus }: Props) {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      scrollWheelZoom
      className="h-full w-full rounded-xl"
    >
      {/* OpenStreetMap — no API key needed */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-cluster nearby flags when zoomed out */}
      <MarkerClusterGroup chunkedLoading>
        {printers.map((printer) => {
          const stale = isStale(printer.last_updated);
          return (
            <Marker
              key={printer.id}
              position={[printer.latitude, printer.longitude]}
              icon={makeFlagIcon(printer.status, stale)}
            >
              <Popup minWidth={210} maxWidth={250}>
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
  const fill = STATUS_FILL[printer.status];

  return (
    <div style={{ fontFamily: "Montserrat, Arial, sans-serif", minWidth: 200 }}>
      <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px", color: "#1a1a1a" }}>
        {printer.name}
      </p>
      <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px" }}>
        {printer.building} · {printer.floor}
      </p>

      {/* Status badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "2px 9px", borderRadius: 99,
        background: fill + "18", border: `1px solid ${fill}44`,
        fontSize: 12, fontWeight: 600, color: fill, marginBottom: 6,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: fill, display: "inline-block" }} />
        {STATUS_LABEL[printer.status]}
      </div>

      {/* Stale warning */}
      {stale && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 8px", borderRadius: 6,
          background: "#fff7ed", border: "1px solid #fed7aa",
          fontSize: 11, color: "#c2410c", marginBottom: 6,
        }}>
          ⚠️ Not verified in {getRelativeTime(printer.last_updated)} — needs check
        </div>
      )}

      {!stale && (
        <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 2px" }}>
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
        }}
        onMouseOver={(e) => ((e.target as HTMLButtonElement).style.background = "#3d0563")}
        onMouseOut={(e) => ((e.target as HTMLButtonElement).style.background = "#57068C")}
      >
        Report Status
      </button>
    </div>
  );
}
