import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mentors, mentorSlots } from "@/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/mentors/[id] — update mentor profile + replace slots
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mentorId = parseInt(id);
    const body = await req.json();
    const { name, major, program, bio, topics, slots } = body as {
      name?: string;
      major?: string;
      program?: string;
      bio?: string;
      topics?: string[];
      slots?: { date: string; startTime: string }[];
    };

    const updates: Partial<typeof mentors.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (major !== undefined) updates.major = major;
    if (program !== undefined) updates.program = program;
    if (bio !== undefined) updates.bio = bio;
    if (topics !== undefined) updates.topics = topics;
    if (slots !== undefined) updates.available = slots.length > 0;

    const [updated] = await db
      .update(mentors)
      .set(updates)
      .where(eq(mentors.id, mentorId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    if (slots !== undefined) {
      // Remove only unbooked slots, keep booked ones
      await db.delete(mentorSlots).where(
        eq(mentorSlots.mentorId, mentorId)
      );
      if (slots.length) {
        await db.insert(mentorSlots).values(
          slots.map((s) => ({ mentorId, date: s.date, startTime: s.startTime }))
        );
      }
    }

    const updatedSlots = await db.select().from(mentorSlots).where(eq(mentorSlots.mentorId, mentorId));
    return NextResponse.json({ ...updated, slots: updatedSlots });
  } catch (err) {
    console.error("PATCH /api/mentors/[id] error:", err);
    return NextResponse.json({ error: "Failed to update mentor" }, { status: 500 });
  }
}
