import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { partners } from "@/db/schema";

const joinSchema = z.object({
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
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid name." }, { status: 400 });
    }

    const joiner = parsed.data.joinerName.trim();

    const [row] = await db.select().from(partners).where(eq(partners.id, listingId));
    if (!row || !row.active) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const current = row.participants ?? [];
    if (current.length >= row.maxParticipants) {
      return NextResponse.json({ error: "Listing is full." }, { status: 409 });
    }
    if (current.some((p) => p.toLowerCase() === joiner.toLowerCase())) {
      return NextResponse.json({ error: "You're already in this listing." }, { status: 409 });
    }

    const [updated] = await db
      .update(partners)
      .set({ participants: [...current, joiner] })
      .where(eq(partners.id, listingId))
      .returning();

    return NextResponse.json({
      participants: updated.participants ?? [],
      currentParticipants: (updated.participants ?? []).length,
      maxParticipants: updated.maxParticipants,
    });
  } catch {
    return NextResponse.json({ error: "Unable to join listing." }, { status: 500 });
  }
}
