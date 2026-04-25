"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { AlertTriangle } from "lucide-react";
import type { Printer, PrinterStatus } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// Status color palette
const STATUS_COLOR: Record<PrinterStatus, string> = {
  working: "#22c55e",
  not_working: "#ef4444",
  unknown: "#eab308",
};

const STATUS_LABEL: Record<PrinterStatus, string> = {
  working: "Working",
  not_working: "Not Working",
  unknown: "Unknown",
};

// Build a custom SVG pin icon; stale printers get an orange warning dot
function makePinIcon(status: PrinterStatus, stale: boolean): L.DivIcon {
  const fill = STATUS_COLOR[status];
  const staleDot = stale
    ? `<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;
         background:#f97316;border:2px solid white;border-radius:50%;"></div>`
    : "";

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:inline-block;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
      <svg width="26" height="38" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 38 13 38C13 38 26 22.75 26 13C26 5.82 20.18 0 13 0Z"
              fill="${fill}" stroke="white" stroke-width="1.5"/>
        <circle cx="13" cy="13" r="5.5" fill="white" opacity="0.9"/>
      </svg>
      ${staleDot}
    </div>`,
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -40],
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  printers: Printer[];
  onReportStatus: (printerId: string) => void;
}

// NYU spans Brooklyn (Tandon) and Manhattan (WSq); this center + zoom shows both
const MAP_CENTER: [number, number] = [40.711, -73.993];
const MAP_ZOOM = 13;

export default function PrinterMap({ printers, onReportStatus }: Props) {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      scrollWheelZoom
      className="h-full w-full rounded-xl"
    >
      {/* OpenStreetMap tiles – no API key required */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Cluster nearby markers automatically */}
      <MarkerClusterGroup chunkedLoading>
        {printers.map((printer) => {
          const stale = isStale(printer.last_updated);
          const icon = makePinIcon(printer.status, stale);

          return (
            <Marker
              key={printer.id}
              position={[printer.latitude, printer.longitude]}
              icon={icon}
            >
              <Popup minWidth={200} maxWidth={240}>
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

// ─── Popup card (rendered inside Leaflet popup) ──────────────────────────────

function PopupCard({
  printer,
  stale,
  onReport,
}: {
  printer: Printer;
  stale: boolean;
  onReport: () => void;
}) {
  const color = STATUS_COLOR[printer.status];

  return (
    <div style={{ fontFamily: "inherit", minWidth: 190 }}>
      {/* Printer name + location */}
      <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 2px" }}>
        {printer.name}
      </p>
      <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px" }}>
        {printer.building} · {printer.floor}
      </p>

      {/* Status badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "2px 8px",
          borderRadius: 99,
          background: color + "22",
          border: `1px solid ${color}55`,
          fontSize: 12,
          fontWeight: 500,
          color,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
          }}
        />
        {STATUS_LABEL[printer.status]}
      </div>

      {/* Stale warning */}
      {stale && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 6,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            fontSize: 11,
            color: "#c2410c",
            marginBottom: 6,
          }}
        >
          <span>⚠️</span>
          Needs verification — last seen {getRelativeTime(printer.last_updated)}
        </div>
      )}

      {/* Timestamps */}
      {!stale && (
        <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 2px" }}>
          Updated {getRelativeTime(printer.last_updated)}
        </p>
      )}
      {printer.last_reported_by && (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 8px" }}>
          Reported by {printer.last_reported_by}
        </p>
      )}

      {/* Printer type chip */}
      <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>
        {printer.printer_type}
      </p>

      {/* Report button */}
      <button
        onClick={onReport}
        style={{
          width: "100%",
          padding: "6px 0",
          borderRadius: 7,
          background: "#1d4ed8",
          color: "white",
          fontSize: 12,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
        }}
        onMouseOver={(e) =>
          ((e.target as HTMLButtonElement).style.background = "#1e40af")
        }
        onMouseOut={(e) =>
          ((e.target as HTMLButtonElement).style.background = "#1d4ed8")
        }
      >
        Report Status
      </button>
    </div>
  );
}
