"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { printers, printerReports } from "@/db/schema";
import { initialPrinters } from "./printerData";
import { Resend } from "resend";
import type { Printer, PrinterStatus } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowToPrinter(row: typeof printers.$inferSelect): Printer {
  return {
    id: row.slug ?? row.id.toString(),
    name: row.name,
    building: row.building,
    floor: row.floor,
    printer_type: row.printerType,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    status: (row.status as PrinterStatus) ?? "unknown",
    last_updated:
      row.lastUpdated?.toISOString() ?? new Date().toISOString(),
    last_reported_by: row.lastReportedBy ?? undefined,
  };
}

// ── Load printers (seeds DB on first run) ────────────────────────────────────

export async function loadPrintersAction(): Promise<Printer[]> {
  const rows = await db
    .select()
    .from(printers)
    .orderBy(printers.name);

  // Seed from local data if table is empty or missing coordinates
  if (rows.length === 0) {
    await db.insert(printers).values(
      initialPrinters.map((p) => ({
        slug: p.id,
        name: p.name,
        building: p.building,
        floor: p.floor,
        printerType: p.printer_type,
        latitude: p.latitude,
        longitude: p.longitude,
        status: p.status,
        lastUpdated: new Date(p.last_updated),
        lastReportedBy: p.last_reported_by ?? null,
      }))
    );
    // Re-fetch after seed so we return DB-generated IDs
    const seeded = await db.select().from(printers).orderBy(printers.name);
    return seeded.map(rowToPrinter);
  }

  return rows.map(rowToPrinter);
}

// ── Report printer status → write to DB ──────────────────────────────────────

export async function reportPrinterStatusAction(
  slug: string,
  status: PrinterStatus,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the printer by its slug
    const [printer] = await db
      .select()
      .from(printers)
      .where(eq(printers.slug, slug))
      .limit(1);

    if (!printer) {
      return { success: false, error: "Printer not found" };
    }

    // Update the printer's live status
    await db
      .update(printers)
      .set({
        status,
        lastUpdated: new Date(),
        lastReportedBy: "student",
      })
      .where(eq(printers.slug, slug));

    // Append an immutable report record for the audit trail
    await db.insert(printerReports).values({
      printerId: printer.id,
      status,
      comment: comment ?? null,
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ── Share credits via email ───────────────────────────────────────────────────

export interface ShareCreditsPayload {
  recipientEmail: string;
  pages: number;
  message?: string;
}

export async function shareCreditsAction(
  payload: ShareCreditsPayload
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { recipientEmail, pages, message } = payload;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "NYU Maxxxxing <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `You've received ${pages} NYU print credit${pages !== 1 ? "s" : ""}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;
                    padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
          <div style="text-align:center;margin-bottom:20px;">
            <span style="background:#57068C;color:white;font-weight:700;font-size:18px;
                         padding:6px 16px;border-radius:6px;letter-spacing:1px;">NYU</span>
          </div>
          <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">
            🎉 You received ${pages} print credit${pages !== 1 ? "s" : ""}!
          </h2>
          <p style="color:#4b5563;font-size:14px;margin:0 0 16px;">
            A fellow NYU student shared <strong>${pages} page${pages !== 1 ? "s" : ""}</strong>
            of print credits with you via <strong>NYU Maxxxxing</strong>.
          </p>
          ${
            message
              ? `<div style="background:#f3f4f6;border-left:3px solid #57068C;
                            padding:10px 14px;border-radius:4px;margin-bottom:16px;">
                  <p style="color:#374151;font-size:13px;margin:0;font-style:italic;">"${message}"</p>
                </div>`
              : ""
          }
          <p style="color:#4b5563;font-size:14px;margin:0 0 8px;">
            Use your credits at any NYU print station across campus.
          </p>
          <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
            Sent via NYU Maxxxxing · This is an automated message.
          </p>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
