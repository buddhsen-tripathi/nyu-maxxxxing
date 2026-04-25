import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { communityNotes } from "@/db/schema";

const typeSchema = z.enum(["heads_up", "working", "suggestion", "event"]);

const createNoteSchema = z.object({
  type: typeSchema,
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  authorName: z.string().max(60).optional(),
  location: z.string().max(80).optional(),
});

function toClient(record: typeof communityNotes.$inferSelect) {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    body: record.body,
    authorName: record.authorName ?? "",
    location: record.location ?? "",
    upvotes: record.upvotes,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(communityNotes)
      .where(eq(communityNotes.active, true))
      .orderBy(desc(communityNotes.createdAt));

    return NextResponse.json({ notes: rows.map(toClient) });
  } catch {
    return NextResponse.json(
      { error: "Unable to load community notes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid note payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    const [created] = await db
      .insert(communityNotes)
      .values({
        type: payload.type,
        title: payload.title,
        body: payload.body,
        authorName: payload.authorName?.trim() || null,
        location: payload.location?.trim() || null,
      })
      .returning();

    return NextResponse.json({ note: toClient(created) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to save note." },
      { status: 500 },
    );
  }
}
