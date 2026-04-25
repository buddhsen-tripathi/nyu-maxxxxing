import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { partners } from "@/db/schema";

const createSchema = z.object({
  activity: z.string().min(1),
  seeking: z.enum(["partner", "group"]),
  description: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  name: z.string().min(1),
  contact: z.string().min(1),
  maxParticipants: z.number().int().min(2).max(50).optional(),
});

function toClient(record: typeof partners.$inferSelect) {
  return {
    id: record.id,
    activity: record.activity,
    seeking: record.seeking,
    description: record.description,
    time: record.time,
    location: record.location,
    name: record.name,
    contact: record.contact,
    maxParticipants: record.maxParticipants,
    participants: record.participants ?? [],
    currentParticipants: (record.participants ?? []).length,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(partners)
      .where(eq(partners.active, true))
      .orderBy(desc(partners.createdAt));

    return NextResponse.json({ listings: rows.map(toClient) });
  } catch {
    return NextResponse.json(
      { error: "Unable to load partner listings." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid listing payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const max =
      payload.maxParticipants ?? (payload.seeking === "partner" ? 2 : 6);

    const [created] = await db
      .insert(partners)
      .values({
        activity: payload.activity,
        seeking: payload.seeking,
        description: payload.description,
        time: payload.time,
        location: payload.location,
        name: payload.name,
        contact: payload.contact,
        maxParticipants: max,
        participants: [payload.name],
      })
      .returning();

    return NextResponse.json({ listing: toClient(created) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create partner listing." },
      { status: 500 },
    );
  }
}
