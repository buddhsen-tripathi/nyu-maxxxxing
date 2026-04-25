import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mentors, mentorSlots } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/mentors — fetch all mentors with their slots
export async function GET() {
  try {
    const allMentors = await db.select().from(mentors);
    const allSlots = await db.select().from(mentorSlots);

    const result = allMentors.map((m) => ({
      ...m,
      slots: allSlots.filter((s) => s.mentorId === m.id && !s.booked),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/mentors error:", err);
    return NextResponse.json({ error: "Failed to fetch mentors" }, { status: 500 });
  }
}

// POST /api/mentors — create a new mentor with slots
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, major, program, bio, topics, slots } = body as {
      name: string;
      email: string;
      major: string;
      program: string;
      bio: string;
      topics: string[];
      slots: { date: string; startTime: string }[];
    };

    if (!name || !email || !major || !topics?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [mentor] = await db
      .insert(mentors)
      .values({ name, email, major, program: program ?? "", bio: bio ?? "", topics, available: slots.length > 0 })
      .returning();

    if (slots?.length) {
      await db.insert(mentorSlots).values(
        slots.map((s) => ({ mentorId: mentor.id, date: s.date, startTime: s.startTime }))
      );
    }

    const insertedSlots = await db.select().from(mentorSlots).where(eq(mentorSlots.mentorId, mentor.id));
    return NextResponse.json({ ...mentor, slots: insertedSlots }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "A mentor with this email already exists" }, { status: 409 });
    }
    console.error("POST /api/mentors error:", err);
    return NextResponse.json({ error: "Failed to create mentor" }, { status: 500 });
  }
}
