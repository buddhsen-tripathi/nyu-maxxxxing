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
  listingId: z.number(),
  listingTitle: z.string().min(1),
  sellerName: z.string().min(1),
  sellerEmail: z.email(),
  interestedName: z.string().min(1),
  interestedEmail: z.email(),
  interestedPhone: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(request: Request) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL;

  if (!resendKey) {
    return NextResponse.json(
      { error: "Server email is not configured. Missing RESEND_API_KEY." },
      { status: 500 }
    );
  }

  if (!fromAddress) {
    return NextResponse.json(
      {
        error:
          "Server email sender is not configured. Add RESEND_FROM_EMAIL to .env.local.",
      },
      { status: 500 }
    );
  }

  const resend = new Resend(resendKey);

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

    const escapedListingTitle = escapeHtml(listingTitle);
    const escapedSellerName = escapeHtml(sellerName);
    const escapedInterestedName = escapeHtml(interestedName);
    const escapedInterestedEmail = escapeHtml(interestedEmail);
    const escapedInterestedPhone = escapeHtml(interestedPhone || "Not provided");
    const escapedMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: sellerEmail,
      subject: `New interest in your listing: ${escapedListingTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2 style="margin-bottom: 8px;">Someone is interested in your listing</h2>
          <p style="margin: 0 0 10px;"><strong>Listing:</strong> ${escapedListingTitle}</p>
          <p style="margin: 0 0 10px;"><strong>Listing ID:</strong> ${listingId}</p>
          <p style="margin: 0 0 10px;"><strong>Seller:</strong> ${escapedSellerName}</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

          <p style="margin: 0 0 10px;"><strong>Interested student:</strong> ${escapedInterestedName}</p>
          <p style="margin: 0 0 10px;"><strong>Email:</strong> ${escapedInterestedEmail}</p>
          <p style="margin: 0 0 10px;"><strong>Phone:</strong> ${escapedInterestedPhone}</p>
          <p style="margin: 0;"><strong>Message:</strong><br />${escapedMessage}</p>
        </div>
      `,
      replyTo: interestedEmail,
    });

    if (error) {
      const details = error.message;
      const hint = details.toLowerCase().includes("testing")
        ? "You are likely using the Resend test sender. Set RESEND_FROM_EMAIL to a verified domain sender in your Resend dashboard."
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
