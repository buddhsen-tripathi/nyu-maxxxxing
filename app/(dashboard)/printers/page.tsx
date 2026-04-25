"use client";

import { useState } from "react";
import {
  Printer,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ArrowRightLeft,
} from "lucide-react";

type PrinterStatus = "online" | "offline" | "issue";

interface PrinterInfo {
  id: string;
  name: string;
  building: string;
  floor: string;
  type: string;
  status: PrinterStatus;
  issue?: string;
}

const printers: PrinterInfo[] = [
  {
    id: "dib-3-a",
    name: "Dibner 3F - A",
    building: "5 MetroTech Center",
    floor: "3rd Floor",
    type: "B&W Laser",
    status: "online",
  },
  {
    id: "dib-3-b",
    name: "Dibner 3F - B",
    building: "5 MetroTech Center",
    floor: "3rd Floor",
    type: "Color Laser",
    status: "online",
  },
  {
    id: "dib-5",
    name: "Dibner 5F",
    building: "5 MetroTech Center",
    floor: "5th Floor",
    type: "B&W Laser",
    status: "issue",
    issue: "Paper jam reported 20 min ago",
  },
  {
    id: "bob-ll",
    name: "Bobst Lower Level",
    building: "70 Washington Sq S",
    floor: "Lower Level",
    type: "B&W Laser",
    status: "online",
  },
  {
    id: "bob-4",
    name: "Bobst 4th Floor",
    building: "70 Washington Sq S",
    floor: "4th Floor",
    type: "Color Laser",
    status: "offline",
    issue: "Out of toner",
  },
  {
    id: "paulson-2",
    name: "Paulson Center 2F",
    building: "370 Jay Street",
    floor: "2nd Floor",
    type: "B&W Laser",
    status: "online",
  },
  {
    id: "kimmel-3",
    name: "Kimmel Center 3F",
    building: "60 Washington Sq S",
    floor: "3rd Floor",
    type: "Color Laser",
    status: "online",
  },
  {
    id: "wsp-lab",
    name: "WSP Computer Lab",
    building: "Warren Weaver Hall",
    floor: "1st Floor",
    type: "B&W Laser",
    status: "issue",
    issue: "Slow printing — queue backed up",
  },
];

const statusConfig: Record<
  PrinterStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  online: {
    label: "Online",
    icon: CheckCircle2,
    className: "text-green-600",
  },
  offline: {
    label: "Offline",
    icon: XCircle,
    className: "text-red-500",
  },
  issue: {
    label: "Issue",
    icon: AlertTriangle,
    className: "text-amber-500",
  },
};

type Tab = "directory" | "report" | "share";

export default function PrintersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("directory");
  const [filter, setFilter] = useState<"all" | PrinterStatus>("all");

  // Report form
  const [reportPrinter, setReportPrinter] = useState("");
  const [reportIssue, setReportIssue] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Share form
  const [shareAmount, setShareAmount] = useState("");
  const [shareRecipient, setShareRecipient] = useState("");
  const [shareSubmitted, setShareSubmitted] = useState(false);

  const filtered =
    filter === "all" ? printers : printers.filter((p) => p.status === filter);

  function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setReportSubmitted(true);
    setReportPrinter("");
    setReportIssue("");
    setTimeout(() => setReportSubmitted(false), 3000);
  }

  function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setShareSubmitted(true);
    setShareAmount("");
    setShareRecipient("");
    setTimeout(() => setShareSubmitted(false), 3000);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "directory", label: "Find Printers" },
    { key: "report", label: "Report Issue" },
    { key: "share", label: "Share Credits" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Printers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find printers, report issues, and share print credits with other NYU
          students.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-card p-1 w-fit">
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

      {/* ── Directory tab ── */}
      {activeTab === "directory" && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "online", "issue", "offline"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  filter === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-card-foreground hover:bg-accent"
                }`}
              >
                {s === "all"
                  ? `All (${printers.length})`
                  : `${s.charAt(0).toUpperCase() + s.slice(1)} (${printers.filter((p) => p.status === s).length})`}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((printer) => {
              const st = statusConfig[printer.status];
              const StatusIcon = st.icon;

              return (
                <div
                  key={printer.id}
                  className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{printer.name}</h3>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {printer.building} &middot; {printer.floor}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${st.className}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {st.label}
                    </div>
                  </div>

                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {printer.type}
                    </span>
                  </div>

                  {printer.issue && (
                    <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                      {printer.issue}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Report tab ── */}
      {activeTab === "report" && (
        <div className="max-w-lg">
          {reportSubmitted ? (
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
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Printer
                </label>
                <select
                  value={reportPrinter}
                  onChange={(e) => setReportPrinter(e.target.value)}
                  required
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a printer...</option>
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
                  value={reportIssue}
                  onChange={(e) => setReportIssue(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Paper jam, out of toner, not responding..."
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

      {/* ── Share credits tab ── */}
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
    </div>
  );
}
