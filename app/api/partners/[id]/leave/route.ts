import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { partners } from "@/db/schema";

const leaveSchema = z.object({
  joinerName: z.string().min(1).max(80),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const listingId = Number(id);
    if (!Number.isFinite(listingId)) {
      return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = leaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid name." }, { status: 400 });
    }

    const leaver = parsed.data.joinerName.trim();

    const [row] = await db.select().from(partners).where(eq(partners.id, listingId));
    if (!row || !row.active) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (leaver.toLowerCase() === row.name.toLowerCase()) {
      return NextResponse.json(
        { error: "Organizer can't leave their own listing." },
        { status: 400 },
      );
    }

    const remaining = (row.participants ?? []).filter(
      (p) => p.toLowerCase() !== leaver.toLowerCase(),
    );

    const [updated] = await db
      .update(partners)
      .set({ participants: remaining })
      .where(eq(partners.id, listingId))
      .returning();

    return NextResponse.json({
      participants: updated.participants ?? [],
      currentParticipants: (updated.participants ?? []).length,
      maxParticipants: updated.maxParticipants,
    });
  } catch {
    return NextResponse.json({ error: "Unable to leave listing." }, { status: 500 });
  }
}
