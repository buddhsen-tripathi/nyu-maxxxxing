import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { bookings, mentorSlots, mentors } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mentorName, mentorEmail, bookerName, bookerEmail, day, startTime, slotId } =
      body as {
        mentorName: string;
        mentorEmail: string;
        bookerName: string;
        bookerEmail: string;
        day: string;
        startTime: string;
        slotId?: number;
      };

    if (!mentorEmail || !bookerEmail) {
      return NextResponse.json({ error: "Both emails are required" }, { status: 400 });
    }

    // Persist booking to DB if slotId provided
    if (slotId) {
      const mentor = await db.select().from(mentors).where(eq(mentors.email, mentorEmail)).then((r) => r[0]);
      if (mentor) {
        await db.insert(bookings).values({
          mentorId: mentor.id,
          slotId,
          bookerName,
          bookerEmail,
        });
        // Mark slot as booked
        await db.update(mentorSlots).set({ booked: true }).where(eq(mentorSlots.id, slotId));
        // Increment session count
        await db.update(mentors).set({ sessions: mentor.sessions + 1 }).where(eq(mentors.id, mentor.id));
      }
    }

    const sessionInfo = `${day} at ${startTime} (20 minutes)`;

    const baseHtml = (heading: string, bodyContent: string) => `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
        <div style="background:#7C3AED;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">NYU Peer Mentoring</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
          <h2 style="margin-top:0">${heading}</h2>
          ${bodyContent}
          <p style="margin-top:20px;font-size:12px;color:#9ca3af">This is an automated confirmation from NYU Maxxxxing.</p>
        </div>
      </div>`;

    const bookerHtml = baseHtml(
      `Your session with ${mentorName} is confirmed!`,
      `<p>Hi ${bookerName},</p>
       <p>You've booked a <strong>20-minute peer mentoring session</strong> with <strong>${mentorName}</strong>.</p>
       <p style="color:#4b5563"><strong>When:</strong> ${sessionInfo}</p>
       <p style="color:#4b5563">You'll hear from ${mentorName} with meeting details shortly.</p>`
    );

    const mentorHtml = baseHtml(
      `New booking: ${bookerName} wants to chat`,
      `<p>Hi ${mentorName},</p>
       <p><strong>${bookerName}</strong> has booked a <strong>20-minute session</strong> with you.</p>
       <p style="color:#4b5563"><strong>When:</strong> ${sessionInfo}</p>
       <p style="color:#4b5563"><strong>Their email:</strong> ${bookerEmail}</p>`
    );

    await Promise.all([
      resend.emails.send({
        from: "NYU Maxxxxing <onboarding@resend.dev>",
        to: bookerEmail,
        subject: `Session confirmed: ${mentorName} · ${sessionInfo}`,
        html: bookerHtml,
      }),
      resend.emails.send({
        from: "NYU Maxxxxing <onboarding@resend.dev>",
        to: mentorEmail,
        subject: `New booking from ${bookerName} · ${sessionInfo}`,
        html: mentorHtml,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-confirmation error:", err);
    return NextResponse.json({ error: "Failed to send confirmation" }, { status: 500 });
  }
}
