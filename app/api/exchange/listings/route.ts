import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
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

const createListingSchema = z.object({
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

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(listings)
      .where(eq(listings.active, true))
      .orderBy(desc(listings.createdAt));

    return NextResponse.json({ listings: rows.map(toClientListing) });
  } catch {
    return NextResponse.json(
      { error: "Unable to load listings from the database." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid listing payload.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const [created] = await db
      .insert(listings)
      .values({
        title: payload.title,
        description: payload.description,
        category: payload.category,
        price: payload.price === 0 ? "Free" : `$${payload.price}`,
        condition: payload.condition,
        sellerName: payload.sellerName,
        contactEmail: payload.sellerEmail,
        contactPhone: payload.sellerPhone,
        imageUrls: payload.imageUrls,
        active: true,
      })
      .returning();

    return NextResponse.json({ listing: toClientListing(created) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to save listing to the database." },
      { status: 500 }
    );
  }
}
