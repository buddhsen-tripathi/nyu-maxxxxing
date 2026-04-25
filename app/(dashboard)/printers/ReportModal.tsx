"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Printer, PrinterStatus, StatusReport } from "./types";

interface Props {
  printer: Printer;
  onSubmit: (report: StatusReport) => void;
  onClose: () => void;
}

export default function ReportModal({ printer, onSubmit, onClose }: Props) {
  const [selected, setSelected] = useState<PrinterStatus | null>(null);
  const [comment, setComment] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    onSubmit({ status: selected, comment: comment.trim() || undefined });
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground">Report status for</p>
            <h2 className="font-semibold">{printer.name}</h2>
            <p className="text-xs text-muted-foreground">
              {printer.building} · {printer.floor}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Status buttons */}
          <div>
            <p className="mb-2 text-sm font-medium">Is this printer working?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelected("working")}
                className={`flex items-center justify-center rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                  selected === "working"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    : "border-border bg-card text-card-foreground hover:border-green-300 hover:bg-green-50/50"
                }`}
              >
                Working
              </button>
              <button
                type="button"
                onClick={() => setSelected("not_working")}
                className={`flex items-center justify-center rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                  selected === "not_working"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                    : "border-border bg-card text-card-foreground hover:border-red-300 hover:bg-red-50/50"
                }`}
              >
                Not Working
              </button>
            </div>
          </div>

          {/* Optional comment */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Comment{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="e.g. Paper jam, out of toner, queue backed up…"
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selected}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
