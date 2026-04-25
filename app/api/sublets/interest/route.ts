import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const payloadSchema = z.object({
  subletId: z.number(),
  subletTitle: z.string().min(1),
  listerName: z.string().min(1),
  listerEmail: z.string().email(),
  interestedName: z.string().min(1),
  interestedEmail: z.string().email(),
  interestedPhone: z.string().optional(),
  message: z.string().min(1).max(1000),
  // Optional move-in window the interested student has
  desiredStart: z.string().optional(),
  desiredEnd: z.string().optional(),
});

export async function POST(request: Request) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "Server email is not configured. Missing RESEND_API_KEY." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const p = parsed.data;

    const fromAddress =
      process.env.EMAIL_FROM ??
      process.env.RESEND_FROM_EMAIL ??
      "NYU Maxxxxing <onboarding@resend.dev>";

    const datesBlock =
      p.desiredStart || p.desiredEnd
        ? `<p style="color:#374151;font-size:13px;margin:0 0 8px;"><strong>Desired window:</strong> ${escapeHtml(p.desiredStart ?? "?")} → ${escapeHtml(p.desiredEnd ?? "?")}</p>`
        : "";

    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: p.listerEmail,
      replyTo: p.interestedEmail,
      subject: `Interest in your sublet: ${p.subletTitle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;
                    padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
          <div style="text-align:center;margin-bottom:20px;">
            <span style="background:#57068C;color:white;font-weight:700;font-size:18px;
                         padding:6px 16px;border-radius:6px;letter-spacing:1px;">NYU</span>
          </div>
          <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">
            Someone wants your sublet
          </h2>
          <p style="color:#4b5563;font-size:14px;margin:0 0 4px;">
            <strong>Sublet:</strong> ${escapeHtml(p.subletTitle)}
          </p>
          <p style="color:#4b5563;font-size:14px;margin:0 0 4px;">
            <strong>Listing ID:</strong> ${p.subletId}
          </p>
          <p style="color:#4b5563;font-size:14px;margin:0 0 16px;">
            <strong>You posted as:</strong> ${escapeHtml(p.listerName)}
          </p>

          <div style="background:#f3f4f6;border-left:3px solid #57068C;
                      padding:10px 14px;border-radius:4px;margin-bottom:16px;">
            <p style="color:#374151;font-size:13px;margin:0 0 8px;">
              <strong>From:</strong> ${escapeHtml(p.interestedName)}
            </p>
            <p style="color:#374151;font-size:13px;margin:0 0 8px;">
              <strong>Email:</strong> ${escapeHtml(p.interestedEmail)}
            </p>
            ${p.interestedPhone ? `<p style="color:#374151;font-size:13px;margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(p.interestedPhone)}</p>` : ""}
            ${datesBlock}
          </div>

          <p style="color:#4b5563;font-size:14px;margin:0 0 6px;"><strong>Message:</strong></p>
          <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">
            ${escapeHtml(p.message).replace(/\n/g, "<br />")}
          </p>

          <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
            Reply to this email to coordinate. Sent via NYU Maxxxxing.
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: "Resend could not send the email.", details: error.message },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while sending interest email." },
      { status: 500 },
    );
  }
}
