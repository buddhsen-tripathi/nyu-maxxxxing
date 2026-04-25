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
  Loader2,
} from "lucide-react";

import { initialPrinters } from "./printerData";
import ReportModal from "./ReportModal";
<<<<<<< Updated upstream
import { isStale, getRelativeTime } from "./PrinterMap";
import { shareCreditsAction } from "./actions";
=======
import { isStale, getRelativeTime } from "./utils";
>>>>>>> Stashed changes
import type {
  Printer as PrinterType,
  PrinterFilter,
  PrinterStatus,
  StatusReport,
} from "./types";

// Map is client-only — Leaflet needs `window`
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

  // Single source of truth for all printer state — map, list, and report form all read from here
  const [printers, setPrinters] = useState<PrinterType[]>(initialPrinters);

  // Map filter
  const [filter, setFilter] = useState<PrinterFilter>("all");

  // Report modal (triggered from map popup)
  const [reportingId, setReportingId] = useState<string | null>(null);
  const reportingPrinter = useMemo(
    () => printers.find((p) => p.id === reportingId) ?? null,
    [printers, reportingId]
  );

  // ── Report Status tab state ───────────────────────────────────────────────
  const [reportPrinterId, setReportPrinterId] = useState("");
  const [reportStatus, setReportStatus] = useState<PrinterStatus | "">("");
  const [reportComment, setReportComment] = useState("");
  const [reportDone, setReportDone] = useState(false);

  // ── Share Credits tab state ───────────────────────────────────────────────
  const [shareRecipient, setShareRecipient] = useState("");
  const [sharePages, setSharePages] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<
    { success: boolean; error?: string } | null
  >(null);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredPrinters = useMemo(() => {
    if (filter === "not_working")
      return printers.filter((p) => p.status === "not_working");
    if (filter === "needs_attention")
      return printers.filter(
        (p) => p.status === "unknown" || isStale(p.last_updated)
      );
    return printers;
  }, [printers, filter]);

  // ── Stat counts ───────────────────────────────────────────────────────────
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

  // ── Core status updater — used by both modal and report tab ───────────────
  function applyStatusReport(
    printerId: string,
    status: PrinterStatus,
    _comment?: string
  ) {
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
  }

  // Called from ReportModal (map popup flow)
  function handleModalReport(report: StatusReport) {
    if (!reportingId) return;
    applyStatusReport(reportingId, report.status, report.comment);
    setReportingId(null);
  }

  // Called from Report Status tab form
  function handleTabReport(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!reportPrinterId || !reportStatus) return;
    applyStatusReport(reportPrinterId, reportStatus as PrinterStatus, reportComment);
    setReportDone(true);
    // Reset form after short delay
    setTimeout(() => {
      setReportDone(false);
      setReportPrinterId("");
      setReportStatus("");
      setReportComment("");
    }, 3000);
  }

  // Called from Share Credits tab form
  async function handleShare(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!shareRecipient || !sharePages) return;
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
        <h1 className="text-2xl font-semibold">Printers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find NYU print stations, check live crowd-sourced status, and share
          credits.
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
        <div className="flex flex-1 flex-col gap-4 min-h-0">
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
              <StatChip color="#57068C" bg="bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900" textColor="text-purple-800 dark:text-purple-300" label={`${counts.working} working`} />
              <StatChip color="#dc2626" bg="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" textColor="text-red-700 dark:text-red-400" label={`${counts.not_working} down`} />
              <StatChip color="#d97706" bg="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900" textColor="text-amber-700 dark:text-amber-400" label={`${counts.unverified} unverified`} />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground shrink-0">
            <LegendFlag color="#57068C" label="Working" />
            <LegendFlag color="#dc2626" label="Not Working" />
            <LegendFlag color="#d97706" label="Unknown" />
            <span className="flex items-center gap-1.5">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-orange-400 text-[7px] font-bold text-white">!</span>
              Orange dot = not verified in 48 h
            </span>
          </div>

          {/* Map */}
          <div className="flex-1 min-h-[420px] overflow-hidden rounded-xl border border-border">
            <PrinterMap
              printers={filteredPrinters}
              onReportStatus={(id) => setReportingId(id)}
            />
          </div>

          {/* Printer card list below map */}
          <PrinterList printers={filteredPrinters} onReport={(id) => setReportingId(id)} />
        </div>
      )}

      {/* ── REPORT STATUS TAB ─────────────────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="max-w-lg">
          {reportDone ? (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 text-center dark:border-purple-900 dark:bg-purple-950/30">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-[#57068C]" />
              <p className="font-medium text-purple-900 dark:text-purple-200">
                Status updated!
              </p>
              <p className="mt-1 text-sm text-purple-700 dark:text-purple-400">
                The map and printer list have been updated. Thanks for helping
                fellow students!
              </p>
            </div>
          ) : (
            <form onSubmit={handleTabReport} className="space-y-5">
              {/* Printer selector */}
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

              {/* Status buttons */}
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

              {/* Comment */}
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
                disabled={!reportPrinterId || !reportStatus}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Submit — updates map &amp; cards
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── SHARE CREDITS TAB ─────────────────────────────────────────────── */}
      {activeTab === "share" && (
        <div className="max-w-lg">
          {/* Success banner */}
          {shareResult?.success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-900 dark:bg-green-950/30">
              <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-green-600" />
              <p className="font-medium text-green-800 dark:text-green-300">
                Credits shared!
              </p>
              <p className="mt-0.5 text-sm text-green-600 dark:text-green-400">
                An email has been sent to the recipient.
              </p>
            </div>
          )}

          {/* Error banner */}
          {shareResult && !shareResult.success && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Failed to send email: {shareResult.error}
              </p>
              <p className="mt-1 text-xs text-red-500">
                Make sure RESEND_API_KEY is set in your environment.
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
                  <p className="text-sm font-medium">
                    Share your unused print credits
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The recipient gets an email telling them exactly how many
                    pages you've shared.
                  </p>
                </div>
              </div>
            </div>

            {/* Recipient email */}
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
                pattern=".*\.edu$"
                title="Must be an .edu email address"
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Must be an .edu address.
              </p>
            </div>

            {/* Pages to share */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Pages to share
              </label>
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

            {/* Optional personal message */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Personal message{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
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
              {shareLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4" />
              )}
              {shareLoading ? "Sending…" : "Share Credits"}
            </button>
          </form>
        </div>
      )}

      {/* Report Status modal (triggered from map popup) */}
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

function StatChip({
  color, bg, textColor, label,
}: {
  color: string; bg: string; textColor: string; label: string;
}) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${bg} ${textColor}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function LegendFlag({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="12" height="16" viewBox="0 0 12 16">
        <rect x="0.5" y="0" width="2" height="15" rx="1" fill={color} />
        <rect x="2.5" y="0.5" width="9" height="7" rx="1" fill={color} />
        <circle cx="1.5" cy="15" r="1.2" fill={color} />
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
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                <Icon className={`h-4 w-4 shrink-0 ${STATUS_COLOR[printer.status]}`} />
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
