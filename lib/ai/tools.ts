import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { spaces, listings, mentors, printers, printerReports } from "@/db/schema";
import { eq, ilike, and, arrayContains } from "drizzle-orm";

export const agentTools = {
  searchSpaces: tool({
    description:
      "Search for study spaces on campus. Can filter by building name, noise level, or tags like Wi-Fi, Power Outlets, Quiet, etc.",
    inputSchema: z.object({
      building: z.string().optional().describe("Building name to filter by (partial match)"),
      noise: z
        .enum(["Silent", "Low", "Moderate", "Loud"])
        .optional()
        .describe("Maximum noise level"),
      tag: z.string().optional().describe("A tag to filter by, e.g. 'Wi-Fi', 'Power Outlets'"),
    }),
    execute: async ({ building, noise, tag }) => {
      const conditions = [];
      if (building) conditions.push(ilike(spaces.building, `%${building}%`));
      if (noise) conditions.push(eq(spaces.noise, noise));
      if (tag) conditions.push(arrayContains(spaces.tags, [tag]));

      const results = await db
        .select()
        .from(spaces)
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(10);

      if (results.length === 0) return { found: 0, message: "No study spaces matched your filters." };
      return { found: results.length, spaces: results };
    },
  }),

  searchListings: tool({
    description:
      "Search the student exchange marketplace for items. Can filter by category and whether the listing is active.",
    inputSchema: z.object({
      category: z
        .enum(["Textbooks", "Furniture", "Meal Swipes", "Electronics", "Other"])
        .optional()
        .describe("Category to filter by"),
      query: z.string().optional().describe("Search term to match against title or description"),
    }),
    execute: async ({ category, query }) => {
      const conditions = [eq(listings.active, true)];
      if (category) conditions.push(eq(listings.category, category));
      if (query) conditions.push(ilike(listings.title, `%${query}%`));

      const results = await db
        .select()
        .from(listings)
        .where(and(...conditions))
        .limit(10);

      if (results.length === 0) return { found: 0, message: "No active listings matched." };
      return { found: results.length, listings: results };
    },
  }),

  createListing: tool({
    description:
      "Create a new listing on the student exchange marketplace. Use this when a student wants to sell or give away an item.",
    inputSchema: z.object({
      title: z.string().describe("Item title"),
      description: z.string().optional().describe("Item description"),
      category: z.enum(["Textbooks", "Furniture", "Meal Swipes", "Electronics", "Other"]),
      price: z.string().describe("Price as a string, e.g. 'Free', '$35'"),
      condition: z.enum(["Like New", "Good", "Fair", "N/A"]).optional(),
      sellerName: z.string().describe("Seller's name"),
      contactEmail: z.string().optional().describe("Contact email"),
    }),
    execute: async (params) => {
      const [created] = await db.insert(listings).values(params).returning();
      return { success: true, listing: created };
    },
  }),

  searchMentors: tool({
    description:
      "Find peer mentors. Can filter by topic (e.g. a course name or subject) or only show available mentors.",
    inputSchema: z.object({
      topic: z.string().optional().describe("Topic or course to filter by (partial match on topics array)"),
      availableOnly: z.boolean().optional().describe("Only return available mentors"),
    }),
    execute: async ({ topic, availableOnly }) => {
      const conditions = [];
      if (availableOnly) conditions.push(eq(mentors.available, true));
      if (topic) conditions.push(arrayContains(mentors.topics, [topic]));

      const results = await db
        .select()
        .from(mentors)
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(10);

      if (results.length === 0) return { found: 0, message: "No mentors matched your filters." };
      return { found: results.length, mentors: results };
    },
  }),

  checkPrinters: tool({
    description:
      "Check the status of campus printers. Can filter by building or status (online, offline, issue).",
    inputSchema: z.object({
      building: z.string().optional().describe("Building name to filter by (partial match)"),
      status: z.enum(["online", "offline", "issue"]).optional().describe("Filter by status"),
    }),
    execute: async ({ building, status }) => {
      const conditions = [];
      if (building) conditions.push(ilike(printers.building, `%${building}%`));
      if (status) conditions.push(eq(printers.status, status));

      const results = await db
        .select()
        .from(printers)
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(20);

      if (results.length === 0) return { found: 0, message: "No printers matched your filters." };
      return { found: results.length, printers: results };
    },
  }),

  reportPrinterIssue: tool({
    description:
      "Report an issue with a campus printer. Requires the printer ID and a description of the issue.",
    inputSchema: z.object({
      printerId: z.number().describe("The ID of the printer with the issue"),
      issue: z.string().describe("Description of the issue"),
    }),
    execute: async ({ printerId, issue }) => {
      const [printer] = await db.select().from(printers).where(eq(printers.id, printerId)).limit(1);
      if (!printer) return { success: false, message: "Printer not found." };

      const [report] = await db.insert(printerReports).values({ printerId, issue }).returning();

      await db.update(printers).set({ status: "issue", issue }).where(eq(printers.id, printerId));

      return {
        success: true,
        report,
        message: `Issue reported for ${printer.name}. Status updated to "issue".`,
      };
    },
  }),
};
