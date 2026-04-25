"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import {
  Send,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
} from "lucide-react";

import { initialPrinters } from "./printerData";
import ReportModal from "./ReportModal";
import { isStale, getRelativeTime } from "./PrinterMap";
import type {
  Printer as PrinterType,
  PrinterFilter,
  PrinterStatus,
  StatusReport,
} from "./types";

// Dynamically import the map so Leaflet (which needs `window`) never runs SSR
const PrinterMap = dynamic(() => import("./PrinterMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-accent/30 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_COLOR: Record<PrinterStatus, string> = {
  working: "text-green-600",
  not_working: "text-red-500",
  unknown: "text-amber-500",
};

const STATUS_BG: Record<PrinterStatus, string> = {
  working: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900",
  not_working: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
  unknown: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
};

const STATUS_ICON: Record<PrinterStatus, typeof CheckCircle2> = {
  working: CheckCircle2,
  not_working: XCircle,
  unknown: AlertTriangle,
};

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "map" | "report" | "share";

const tabs: { key: Tab; label: string }[] = [
  { key: "map", label: "Find Printers" },
  { key: "report", label: "Report Issue" },
  { key: "share", label: "Share Credits" },
];

// ─── Page component ──────────────────────────────────────────────────────────

export default function PrintersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("map");

  // Printer state – in production this would come from an API / SWR / React Query
  const [printers, setPrinters] = useState<PrinterType[]>(initialPrinters);

  // Map filter
  const [filter, setFilter] = useState<PrinterFilter>("all");

  // Report modal
  const [reportingId, setReportingId] = useState<string | null>(null);
  const reportingPrinter = useMemo(
    () => printers.find((p) => p.id === reportingId) ?? null,
    [printers, reportingId]
  );

  // Legacy "Report Issue" tab state (kept intact)
  const [issueReportPrinter, setIssueReportPrinter] = useState("");
  const [issueReportText, setIssueReportText] = useState("");
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  // "Share Credits" tab state (kept intact)
  const [shareAmount, setShareAmount] = useState("");
  const [shareRecipient, setShareRecipient] = useState("");
  const [shareSubmitted, setShareSubmitted] = useState(false);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredPrinters = useMemo(() => {
    if (filter === "not_working")
      return printers.filter((p) => p.status === "not_working");
    if (filter === "needs_attention")
      return printers.filter(
        (p) => p.status === "unknown" || isStale(p.last_updated)
      );
    return printers;
  }, [printers, filter]);

  // ── Status update (called from ReportModal) ───────────────────────────────
  function handleStatusReport(report: StatusReport) {
    if (!reportingId) return;
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === reportingId
          ? {
              ...p,
              status: report.status,
              last_updated: new Date().toISOString(),
              last_reported_by: "you",
            }
          : p
      )
    );
    setReportingId(null);
  }

  // ── Stat counts for the summary row ──────────────────────────────────────
  const counts = useMemo(
    () => ({
      working: printers.filter((p) => p.status === "working").length,
      not_working: printers.filter((p) => p.status === "not_working").length,
      unknown: printers.filter((p) => p.status === "unknown").length,
      stale: printers.filter(
        (p) =>
          isStale(p.last_updated) &&
          p.status !== "not_working" &&
          p.status !== "unknown"
      ).length,
    }),
    [printers]
  );

  function handleIssueReport(e: { preventDefault(): void }) {
    e.preventDefault();
    setIssueSubmitted(true);
    setIssueReportPrinter("");
    setIssueReportText("");
    setTimeout(() => setIssueSubmitted(false), 3000);
  }

  function handleShare(e: { preventDefault(): void }) {
    e.preventDefault();
    setShareSubmitted(true);
    setShareAmount("");
    setShareRecipient("");
    setTimeout(() => setShareSubmitted(false), 3000);
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Printers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find printers across NYU campuses, check live status, and report
          issues.
        </p>
      </div>

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-lg border border-border bg-card p-1 w-fit shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MAP TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "map" && (
        <div className="flex flex-1 flex-col gap-4 min-h-0">
          {/* Filter bar + stat chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Filters */}
            <div className="flex gap-2">
              {(
                [
                  { key: "all", label: `All (${printers.length})` },
                  { key: "not_working", label: `Not Working (${counts.not_working})` },
                  { key: "needs_attention", label: `Needs Attention (${counts.unknown + counts.stale})` },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    filter === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-card-foreground hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Stat chips */}
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {counts.working} working
              </span>
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {counts.not_working} down
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {counts.unknown + counts.stale} unverified
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground shrink-0">
            <LegendDot color="#22c55e" label="Working" />
            <LegendDot color="#ef4444" label="Not Working" />
            <LegendDot color="#eab308" label="Unknown" />
            <span className="flex items-center gap-1">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-orange-400 text-[8px] text-white">!</span>
              Orange dot = not verified in 48 h
            </span>
          </div>

          {/* Map — takes remaining vertical space */}
          <div className="flex-1 min-h-[400px] overflow-hidden rounded-xl border border-border">
            <PrinterMap
              printers={filteredPrinters}
              onReportStatus={(id) => setReportingId(id)}
            />
          </div>

          {/* Printer list (scrollable, below map on smaller screens) */}
          <PrinterList
            printers={filteredPrinters}
            onReport={(id) => setReportingId(id)}
          />
        </div>
      )}

      {/* ── REPORT ISSUE TAB ────────────────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="max-w-lg">
          {issueSubmitted ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/30">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-600" />
              <p className="font-medium text-green-800 dark:text-green-300">
                Report submitted
              </p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                Thanks for letting us know. We'll update the printer status.
              </p>
            </div>
          ) : (
            <form onSubmit={handleIssueReport} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Printer
                </label>
                <select
                  value={issueReportPrinter}
                  onChange={(e) => setIssueReportPrinter(e.target.value)}
                  required
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a printer…</option>
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.building}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  What's wrong?
                </label>
                <textarea
                  value={issueReportText}
                  onChange={(e) => setIssueReportText(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Paper jam, out of toner, not responding…"
                  className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
                Submit Report
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── SHARE CREDITS TAB ───────────────────────────────────────────── */}
      {activeTab === "share" && (
        <div className="max-w-lg">
          {shareSubmitted ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/30">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-600" />
              <p className="font-medium text-green-800 dark:text-green-300">
                Credits shared!
              </p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                The recipient will be notified. Thanks for helping out a fellow
                Violet.
              </p>
            </div>
          ) : (
            <form onSubmit={handleShare} className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Share your unused print credits
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Help a fellow student print their assignment. Credits
                      transfer instantly.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Recipient NYU email
                </label>
                <input
                  type="email"
                  value={shareRecipient}
                  onChange={(e) => setShareRecipient(e.target.value)}
                  required
                  placeholder="netid@nyu.edu"
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Pages to share
                </label>
                <input
                  type="number"
                  value={shareAmount}
                  onChange={(e) => setShareAmount(e.target.value)}
                  required
                  min={1}
                  max={500}
                  placeholder="e.g. 50"
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Each NYU student gets 200 free B&W pages per semester.
                </p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Share Credits
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Report Status modal (triggered from map popup) ───────────── */}
      {reportingPrinter && (
        <ReportModal
          printer={reportingPrinter}
          onSubmit={handleStatusReport}
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <svg width="10" height="14" viewBox="0 0 10 14">
        <path
          d="M5 0C2.24 0 0 2.24 0 5C0 8.75 5 14 5 14C5 14 10 8.75 10 5C10 2.24 7.76 0 5 0Z"
          fill={color}
        />
      </svg>
      {label}
    </span>
  );
}

function PrinterList({
  printers,
  onReport,
}: {
  printers: PrinterType[];
  onReport: (id: string) => void;
}) {
  if (printers.length === 0) return null;

  return (
    <div className="shrink-0">
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {printers.length} printer{printers.length !== 1 ? "s" : ""} shown
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {printers.map((printer) => {
          const stale = isStale(printer.last_updated);
          const Icon = STATUS_ICON[printer.status];

          return (
            <div
              key={printer.id}
              className={`rounded-lg border p-3 ${STATUS_BG[printer.status]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{printer.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{printer.building}</span>
                  </p>
                </div>
                <Icon
                  className={`h-4 w-4 shrink-0 ${STATUS_COLOR[printer.status]}`}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {stale ? (
                    <span className="text-orange-500">
                      ⚠ {getRelativeTime(printer.last_updated)}
                    </span>
                  ) : (
                    getRelativeTime(printer.last_updated)
                  )}
                </p>
                <button
                  onClick={() => onReport(printer.id)}
                  className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  Report
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
