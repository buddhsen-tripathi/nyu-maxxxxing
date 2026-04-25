import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sublets } from "@/db/schema";

const createSubletSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(2000),
  neighborhood: z.string().min(1).max(80),
  address: z.string().max(120).optional(),
  monthlyRent: z.number().int().min(0).max(20000),
  utilitiesIncluded: z.boolean().default(false),
  leaseStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "leaseStart must be ISO date YYYY-MM-DD"),
  leaseEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "leaseEnd must be ISO date YYYY-MM-DD"),
  bedrooms: z.number().min(0).max(10),
  bathrooms: z.number().min(0).max(10),
  furnished: z.boolean().default(false),
  genderPref: z.enum(["any", "female", "male", "nonbinary"]).optional(),
  imageUrls: z.array(z.string().min(1)).default([]),
  listerName: z.string().min(1).max(60),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(40).optional(),
});

function toClient(record: typeof sublets.$inferSelect) {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    neighborhood: record.neighborhood,
    address: record.address ?? "",
    monthlyRent: record.monthlyRent,
    utilitiesIncluded: record.utilitiesIncluded,
    leaseStart: record.leaseStart,
    leaseEnd: record.leaseEnd,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    furnished: record.furnished,
    genderPref: record.genderPref ?? "any",
    imageUrls: record.imageUrls ?? [],
    listerName: record.listerName,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone ?? "",
    createdAt: record.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(sublets)
      .where(eq(sublets.active, true))
      .orderBy(desc(sublets.createdAt));
    return NextResponse.json({ sublets: rows.map(toClient) });
  } catch {
    return NextResponse.json({ error: "Unable to load sublets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSubletSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid sublet payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const p = parsed.data;
    const [created] = await db
      .insert(sublets)
      .values({
        title: p.title,
        description: p.description,
        neighborhood: p.neighborhood,
        address: p.address ?? null,
        monthlyRent: p.monthlyRent,
        utilitiesIncluded: p.utilitiesIncluded,
        leaseStart: p.leaseStart,
        leaseEnd: p.leaseEnd,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        furnished: p.furnished,
        genderPref: p.genderPref && p.genderPref !== "any" ? p.genderPref : null,
        imageUrls: p.imageUrls,
        listerName: p.listerName,
        contactEmail: p.contactEmail,
        contactPhone: p.contactPhone ?? null,
        active: true,
      })
      .returning();
    return NextResponse.json({ sublet: toClient(created) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save sublet." }, { status: 500 });
  }
}
