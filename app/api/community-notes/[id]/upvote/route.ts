import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { communityNotes } from "@/db/schema";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const noteId = Number(id);

    if (!Number.isFinite(noteId)) {
      return NextResponse.json({ error: "Invalid note id." }, { status: 400 });
    }

    const [updated] = await db
      .update(communityNotes)
      .set({ upvotes: sql`${communityNotes.upvotes} + 1` })
      .where(eq(communityNotes.id, noteId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ upvotes: updated.upvotes });
  } catch {
    return NextResponse.json(
      { error: "Unable to upvote note." },
      { status: 500 },
    );
  }
}
