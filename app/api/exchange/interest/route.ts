import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

interface SendInterestPayload {
  listingId: number;
  listingTitle: string;
  sellerName: string;
  sellerEmail: string;
  interestedName: string;
  interestedEmail: string;
  interestedPhone?: string;
  message: string;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const payloadSchema = z.object({
  listingId: z.number(),
  listingTitle: z.string().min(1),
  sellerName: z.string().min(1),
  sellerEmail: z.email(),
  interestedName: z.string().min(1),
  interestedEmail: z.email(),
  interestedPhone: z.string().optional(),
  message: z.string().min(1),
});

async function sendInterestEmailAction(
  payload: SendInterestPayload
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const {
    listingId,
    listingTitle,
    sellerName,
    sellerEmail,
    interestedName,
    interestedEmail,
    interestedPhone,
    message,
  } = payload;

  const escapedListingTitle = escapeHtml(listingTitle);
  const escapedSellerName = escapeHtml(sellerName);
  const escapedInterestedName = escapeHtml(interestedName);
  const escapedInterestedEmail = escapeHtml(interestedEmail);
  const escapedInterestedPhone = escapeHtml(interestedPhone || "Not provided");
  const escapedMessage = escapeHtml(message).replace(/\n/g, "<br />");

  const fromAddress =
    process.env.EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    "NYU Maxxxxing <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: sellerEmail,
      subject: `New interest in your listing: ${escapedListingTitle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;
                    padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
          <div style="text-align:center;margin-bottom:20px;">
            <span style="background:#57068C;color:white;font-weight:700;font-size:18px;
                         padding:6px 16px;border-radius:6px;letter-spacing:1px;">NYU</span>
          </div>
          <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">
            Someone is interested in your listing
          </h2>
          <p style="color:#4b5563;font-size:14px;margin:0 0 8px;">
            <strong>Listing:</strong> ${escapedListingTitle}
          </p>
          <p style="color:#4b5563;font-size:14px;margin:0 0 8px;">
            <strong>Listing ID:</strong> ${listingId}
          </p>
          <p style="color:#4b5563;font-size:14px;margin:0 0 16px;">
            <strong>Seller:</strong> ${escapedSellerName}
          </p>

          <div style="background:#f3f4f6;border-left:3px solid #57068C;
                      padding:10px 14px;border-radius:4px;margin-bottom:16px;">
            <p style="color:#374151;font-size:13px;margin:0 0 8px;">
              <strong>Interested student:</strong> ${escapedInterestedName}
            </p>
            <p style="color:#374151;font-size:13px;margin:0 0 8px;">
              <strong>Email:</strong> ${escapedInterestedEmail}
            </p>
            <p style="color:#374151;font-size:13px;margin:0;">
              <strong>Phone:</strong> ${escapedInterestedPhone}
            </p>
          </div>

          <p style="color:#4b5563;font-size:14px;margin:0 0 6px;"><strong>Message:</strong></p>
          <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">${escapedMessage}</p>

          <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
            Sent via NYU Maxxxxing · This is an automated message.
          </p>
        </div>
      `,
      replyTo: interestedEmail,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: messageText };
  }
}

export async function POST(request: Request) {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    return NextResponse.json(
      { error: "Server email is not configured. Missing RESEND_API_KEY." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      listingId,
      listingTitle,
      sellerName,
      sellerEmail,
      interestedName,
      interestedEmail,
      interestedPhone,
      message,
    } = parsed.data;

    const result = await sendInterestEmailAction({
      listingId,
      listingTitle,
      sellerName,
      sellerEmail,
      interestedName,
      interestedEmail,
      interestedPhone,
      message,
    });

    if (!result.success) {
      const details = result.error;
      const hint = details?.toLowerCase().includes("testing")
        ? "Your sender may be in testing mode. Set EMAIL_FROM (or RESEND_FROM_EMAIL) to a verified sender in Resend."
        : undefined;

      return NextResponse.json(
        { error: "Resend could not send the email.", details, hint },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while sending interest email." },
      { status: 500 }
    );
  }
}
