"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Send,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Loader2,
  Search,
  RefreshCw,
} from "lucide-react";

import { initialPrinters } from "./printerData";
import ReportModal from "./ReportModal";
import { isStale, getRelativeTime } from "./PrinterMap";
import {
  loadPrintersAction,
  reportPrinterStatusAction,
  shareCreditsAction,
} from "./actions";
import type {
  Printer as PrinterType,
  PrinterFilter,
  PrinterStatus,
  StatusReport,
} from "./types";

// Map runs client-only (Leaflet needs `window`)
const PrinterMap = dynamic(() => import("./PrinterMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-accent/30 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

// ─── Status display config ───────────────────────────────────────────────────

const STATUS_COLOR: Record<PrinterStatus, string> = {
  working: "text-[#57068C]",
  not_working: "text-red-500",
  unknown: "text-amber-500",
};

const STATUS_BG: Record<PrinterStatus, string> = {
  working:
    "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900",
  not_working:
    "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
  unknown:
    "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
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
  { key: "report", label: "Report Status" },
  { key: "share", label: "Share Credits" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PrintersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("map");

  // Single source of truth — seeded from DB on mount, polled every 30 s
  const [printers, setPrinters] = useState<PrinterType[]>(initialPrinters);
  const [dbLoading, setDbLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Map controls
  const [filter, setFilter] = useState<PrinterFilter>("all");
  const [search, setSearch] = useState("");

  // Report modal (map popup path)
  const [reportingId, setReportingId] = useState<string | null>(null);
  const reportingPrinter = useMemo(
    () => printers.find((p) => p.id === reportingId) ?? null,
    [printers, reportingId]
  );

  // Report Status tab state
  const [reportPrinterId, setReportPrinterId] = useState("");
  const [reportStatus, setReportStatus] = useState<PrinterStatus | "">("");
  const [reportComment, setReportComment] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  // Share Credits tab state
  const [shareRecipient, setShareRecipient] = useState("");
  const [sharePages, setSharePages] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  // ── DB fetch + polling ────────────────────────────────────────────────────
  const fetchFromDB = useCallback(async () => {
    try {
      const fresh = await loadPrintersAction();
      setPrinters(fresh);
      setLastSynced(new Date());
    } catch {
      // If DB unreachable, keep current state (local seed stays shown)
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFromDB();
    // Poll every 30 seconds so other students' reports appear automatically
    const interval = setInterval(fetchFromDB, 30_000);
    return () => clearInterval(interval);
  }, [fetchFromDB]);

  // ── Filter + search ───────────────────────────────────────────────────────
  const filteredPrinters = useMemo(() => {
    let list = printers;
    if (filter === "not_working")
      list = list.filter((p) => p.status === "not_working");
    else if (filter === "needs_attention")
      list = list.filter(
        (p) => p.status === "unknown" || isStale(p.last_updated)
      );

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.building.toLowerCase().includes(q) ||
          p.floor.toLowerCase().includes(q)
      );
    }
    return list;
  }, [printers, filter, search]);

  // When search narrows to ≥1 result, fly the map to the first match
  const flyTarget = useMemo<[number, number] | null>(() => {
    if (!search.trim() || filteredPrinters.length === 0) return null;
    const first = filteredPrinters[0];
    return [first.latitude, first.longitude];
  }, [search, filteredPrinters]);

  // Stat counts
  const counts = useMemo(
    () => ({
      working: printers.filter((p) => p.status === "working").length,
      not_working: printers.filter((p) => p.status === "not_working").length,
      unverified: printers.filter(
        (p) => p.status === "unknown" || isStale(p.last_updated)
      ).length,
    }),
    [printers]
  );

  // ── Core status updater ───────────────────────────────────────────────────
  // Optimistically updates local state, then writes to DB.
  async function applyStatusReport(
    printerId: string,
    status: PrinterStatus,
    comment?: string
  ) {
    // Optimistic UI update
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === printerId
          ? {
              ...p,
              status,
              last_updated: new Date().toISOString(),
              last_reported_by: "you",
            }
          : p
      )
    );
    // Persist to Neon Postgres
    await reportPrinterStatusAction(printerId, status, comment);
  }

  // Report modal submit (triggered from map popup)
  async function handleModalReport(report: StatusReport) {
    if (!reportingId) return;
    setReportingId(null);
    await applyStatusReport(reportingId, report.status, report.comment);
  }

  // Report Status tab submit
  async function handleTabReport(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!reportPrinterId || !reportStatus) return;
    setReportLoading(true);
    await applyStatusReport(
      reportPrinterId,
      reportStatus as PrinterStatus,
      reportComment
    );
    setReportLoading(false);
    setReportDone(true);
    setTimeout(() => {
      setReportDone(false);
      setReportPrinterId("");
      setReportStatus("");
      setReportComment("");
    }, 3000);
  }

  // Share Credits submit
  async function handleShare(e: { preventDefault(): void }) {
    e.preventDefault();
    setShareLoading(true);
    setShareResult(null);
    const result = await shareCreditsAction({
      recipientEmail: shareRecipient,
      pages: Number(sharePages),
      message: shareMessage.trim() || undefined,
    });
    setShareLoading(false);
    setShareResult(result);
    if (result.success) {
      setShareRecipient("");
      setSharePages("");
      setShareMessage("");
    }
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Printers</h1>
          {/* Live sync indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {dbLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-green-500" />
            )}
            {lastSynced
              ? `Synced ${getRelativeTime(lastSynced.toISOString())}`
              : "Connecting…"}
          </div>
          <button
            onClick={fetchFromDB}
            title="Refresh now"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          All 35 NYU print stations · updates every 30 s from the database.
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

      {/* ── MAP TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "map" && (
        <div className="flex flex-1 flex-col gap-3 min-h-0">
          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search printers by name, building, or floor…"
              className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter + stat row */}
          <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: `All (${printers.length})` },
                  { key: "not_working", label: `Not Working (${counts.not_working})` },
                  { key: "needs_attention", label: `Needs Attention (${counts.unverified})` },
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
            <div className="flex gap-2 text-xs">
              <StatChip dot="#57068C" bg="bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900" text="text-purple-800 dark:text-purple-300" label={`${counts.working} working`} />
              <StatChip dot="#ef4444" bg="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" text="text-red-700 dark:text-red-400" label={`${counts.not_working} down`} />
              <StatChip dot="#f59e0b" bg="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900" text="text-amber-700 dark:text-amber-400" label={`${counts.unverified} unverified`} />
            </div>
          </div>

          {/* Search result hint */}
          {search.trim() && (
            <p className="shrink-0 text-xs text-muted-foreground">
              {filteredPrinters.length === 0
                ? "No printers match your search."
                : `${filteredPrinters.length} match${filteredPrinters.length !== 1 ? "es" : ""} — map zoomed to first result`}
            </p>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground shrink-0">
            <LegendMarker dotColor="#22c55e" label="Working" />
            <LegendMarker dotColor="#ef4444" label="Not Working" />
            <LegendMarker dotColor="#f59e0b" label="Unknown" />
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-400 ring-2 ring-orange-200" />
              Pulsing = not verified in 48 h
            </span>
          </div>

          {/* Map */}
          <div className="flex-1 min-h-[420px] overflow-hidden rounded-xl border border-border">
            <PrinterMap
              printers={filteredPrinters}
              flyTarget={flyTarget}
              onReportStatus={(id) => setReportingId(id)}
            />
          </div>

          {/* Card list */}
          <PrinterCardList
            printers={filteredPrinters}
            onReport={(id) => setReportingId(id)}
          />
        </div>
      )}

      {/* ── REPORT STATUS TAB ─────────────────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="max-w-lg">
          {reportDone ? (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 text-center dark:border-purple-900 dark:bg-purple-950/30">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-[#57068C]" />
              <p className="font-medium text-purple-900 dark:text-purple-200">
                Status saved to database!
              </p>
              <p className="mt-1 text-sm text-purple-700 dark:text-purple-400">
                The map and card list have been updated in real time.
              </p>
            </div>
          ) : (
            <form onSubmit={handleTabReport} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Printer
                </label>
                <select
                  value={reportPrinterId}
                  onChange={(e) => setReportPrinterId(e.target.value)}
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
                <label className="mb-2 block text-sm font-medium">
                  Is it working right now?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReportStatus("working")}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                      reportStatus === "working"
                        ? "border-purple-600 bg-purple-50 text-purple-800 dark:bg-purple-950/30"
                        : "border-border bg-card hover:border-purple-300 hover:bg-purple-50/50"
                    }`}
                  >
                    <CheckCircle2 className="h-6 w-6 text-[#57068C]" />
                    Working ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportStatus("not_working")}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                      reportStatus === "not_working"
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30"
                        : "border-border bg-card hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    <XCircle className="h-6 w-6 text-red-500" />
                    Not Working ❌
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Comment{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  rows={2}
                  placeholder="e.g. Paper jam, out of toner, queue backed up…"
                  className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={!reportPrinterId || !reportStatus || reportLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {reportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {reportLoading ? "Saving…" : "Submit — saves to DB & updates map"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── SHARE CREDITS TAB ─────────────────────────────────────────────── */}
      {activeTab === "share" && (
        <div className="max-w-lg">
          {shareResult?.success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-900 dark:bg-green-950/30">
              <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-green-600" />
              <p className="font-medium text-green-800 dark:text-green-300">Credits shared!</p>
              <p className="mt-0.5 text-sm text-green-600 dark:text-green-400">
                Email sent to the recipient.
              </p>
            </div>
          )}
          {shareResult && !shareResult.success && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Failed: {shareResult.error}
              </p>
              <p className="mt-1 text-xs text-red-500">
                Ensure RESEND_API_KEY is set in .env.local
              </p>
            </div>
          )}
          <form onSubmit={handleShare} className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Share unused print credits</p>
                  <p className="text-xs text-muted-foreground">
                    Recipient gets an email with the exact page count.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Recipient .edu email</label>
              <input
                type="email"
                value={shareRecipient}
                onChange={(e) => setShareRecipient(e.target.value)}
                required
                placeholder="netid@nyu.edu"
                pattern=".*\.edu$"
                title="Must be an .edu email address"
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Pages to share</label>
              <input
                type="number"
                value={sharePages}
                onChange={(e) => setSharePages(e.target.value)}
                required
                min={1}
                max={500}
                placeholder="e.g. 50"
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Personal message{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={2}
                placeholder="e.g. Good luck with finals!"
                className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={shareLoading}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {shareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
              {shareLoading ? "Sending…" : "Share Credits"}
            </button>
          </form>
        </div>
      )}

      {/* Report modal (map popup path) */}
      {reportingPrinter && (
        <ReportModal
          printer={reportingPrinter}
          onSubmit={handleModalReport}
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatChip({ dot, bg, text, label }: { dot: string; bg: string; text: string; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${bg} ${text}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

function LegendMarker({ dotColor, label }: { dotColor: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {/* Mini NYU flag icon */}
      <svg width="14" height="18" viewBox="0 0 14 18">
        <path d="M7 0C3.13 0 0 3.13 0 7C0 12.25 7 18 7 18C7 18 14 12.25 14 7C14 3.13 10.87 0 7 0Z" fill="#57068C"/>
        <circle cx="11" cy="11" r="3" fill={dotColor} stroke="white" stroke-width="1"/>
      </svg>
      {label}
    </span>
  );
}

function PrinterCardList({
  printers,
  onReport,
}: {
  printers: PrinterType[];
  onReport: (id: string) => void;
}) {
  if (printers.length === 0) return null;

  return (
    <div className="shrink-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {printers.length} printer{printers.length !== 1 ? "s" : ""} shown
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {printers.map((printer) => {
          const stale = isStale(printer.last_updated);
          const Icon = STATUS_ICON[printer.status];

          return (
            <div key={printer.id} className={`rounded-lg border p-3 ${STATUS_BG[printer.status]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{printer.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{printer.building}</span>
                  </p>
                </div>
                <Icon className={`h-4 w-4 shrink-0 ${STATUS_COLOR[printer.status]}`} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {stale ? (
                    <span className="text-orange-500">⚠ {getRelativeTime(printer.last_updated)}</span>
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
