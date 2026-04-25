import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sublets } from "@/db/schema";

const patchSchema = z.object({
  title: z.string().min(1).max(140).optional(),
  description: z.string().min(1).max(2000).optional(),
  neighborhood: z.string().min(1).max(80).optional(),
  address: z.string().max(120).optional(),
  monthlyRent: z.number().int().min(0).max(20000).optional(),
  utilitiesIncluded: z.boolean().optional(),
  leaseStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  leaseEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bedrooms: z.number().min(0).max(10).optional(),
  bathrooms: z.number().min(0).max(10).optional(),
  furnished: z.boolean().optional(),
  genderPref: z.enum(["any", "female", "male", "nonbinary"]).optional(),
  imageUrls: z.array(z.string().min(1)).optional(),
  listerName: z.string().min(1).max(60).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
});

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid sublet id." }, { status: 400 });

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const p = parsed.data;
    // Translate genderPref "any" → null
    const genderPref =
      p.genderPref === undefined ? undefined : p.genderPref === "any" ? null : p.genderPref;

    const updates: Partial<typeof sublets.$inferInsert> = {};
    if (p.title !== undefined) updates.title = p.title;
    if (p.description !== undefined) updates.description = p.description;
    if (p.neighborhood !== undefined) updates.neighborhood = p.neighborhood;
    if (p.address !== undefined) updates.address = p.address;
    if (p.monthlyRent !== undefined) updates.monthlyRent = p.monthlyRent;
    if (p.utilitiesIncluded !== undefined) updates.utilitiesIncluded = p.utilitiesIncluded;
    if (p.leaseStart !== undefined) updates.leaseStart = p.leaseStart;
    if (p.leaseEnd !== undefined) updates.leaseEnd = p.leaseEnd;
    if (p.bedrooms !== undefined) updates.bedrooms = p.bedrooms;
    if (p.bathrooms !== undefined) updates.bathrooms = p.bathrooms;
    if (p.furnished !== undefined) updates.furnished = p.furnished;
    if (genderPref !== undefined) updates.genderPref = genderPref;
    if (p.imageUrls !== undefined) updates.imageUrls = p.imageUrls;
    if (p.listerName !== undefined) updates.listerName = p.listerName;
    if (p.contactEmail !== undefined) updates.contactEmail = p.contactEmail;
    if (p.contactPhone !== undefined) updates.contactPhone = p.contactPhone;

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });

    const [updated] = await db
      .update(sublets)
      .set(updates)
      .where(and(eq(sublets.id, id), eq(sublets.active, true)))
      .returning();
    if (!updated)
      return NextResponse.json({ error: "Sublet not found." }, { status: 404 });
    return NextResponse.json({ sublet: updated });
  } catch {
    return NextResponse.json({ error: "Unable to update sublet." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid sublet id." }, { status: 400 });

  try {
    const [deleted] = await db
      .update(sublets)
      .set({ active: false })
      .where(and(eq(sublets.id, id), eq(sublets.active, true)))
      .returning({ id: sublets.id });
    if (!deleted)
      return NextResponse.json({ error: "Sublet not found." }, { status: 404 });
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch {
    return NextResponse.json({ error: "Unable to delete sublet." }, { status: 500 });
  }
}
