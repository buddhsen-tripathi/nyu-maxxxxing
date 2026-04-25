import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { listings } from "@/db/schema";

const categorySchema = z.enum([
  "Textbooks",
  "Furniture",
  "Meal Swipes",
  "Electronics",
  "Other",
]);

const conditionSchema = z.enum(["Like New", "Good", "Fair", "N/A"]);

const updateListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: categorySchema,
  condition: conditionSchema,
  price: z.number().min(0),
  sellerName: z.string().min(1),
  sellerEmail: z.email(),
  sellerPhone: z.string().min(1),
  imageUrls: z.array(z.string().min(1)).min(1),
});

function toClientListing(record: typeof listings.$inferSelect) {
  const numericPrice = Number(record.price.replace(/[^\d.]/g, ""));

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "",
    category: record.category,
    condition: record.condition ?? "N/A",
    price: Number.isFinite(numericPrice) ? numericPrice : 0,
    seller: record.sellerName,
    sellerEmail: record.contactEmail ?? "",
    sellerPhone: record.contactPhone ?? "",
    imageUrls: record.imageUrls ?? [],
    createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid listing payload.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const [updated] = await db
      .update(listings)
      .set({
        title: payload.title,
        description: payload.description,
        category: payload.category,
        price: payload.price === 0 ? "Free" : `$${payload.price}`,
        condition: payload.condition,
        sellerName: payload.sellerName,
        contactEmail: payload.sellerEmail,
        contactPhone: payload.sellerPhone,
        imageUrls: payload.imageUrls,
      })
      .where(and(eq(listings.id, id), eq(listings.active, true)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    return NextResponse.json({ listing: toClientListing(updated) });
  } catch {
    return NextResponse.json(
      { error: "Unable to update listing." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .update(listings)
      .set({ active: false })
      .where(and(eq(listings.id, id), eq(listings.active, true)))
      .returning({ id: listings.id });

    if (!deleted) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: deleted.id });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete listing." },
      { status: 500 }
    );
  }
}
