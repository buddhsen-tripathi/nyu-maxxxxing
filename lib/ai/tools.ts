import { tool } from "ai";
import { z } from "zod";
import { initialSpaces } from "@/app/(dashboard)/spaces/spacesData";
import { initialPrinters } from "@/app/(dashboard)/printers/printerData";
import { initialListings } from "@/app/(dashboard)/exchange/listingsData";
import { initialMentors } from "@/app/(dashboard)/mentoring/mentorsData";
import { isStale } from "@/app/(dashboard)/printers/utils";

function ciIncludes(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export const agentTools = {
  searchSpaces: tool({
    description:
      "Search NYU study spaces. Returns name, building, floor, hours, capacity, noise level, amenities, and a tip when available. Use to recommend places to study, group rooms, quiet libraries, hidden gems, etc.",
    inputSchema: z.object({
      noise: z
        .enum(["silent", "quiet", "moderate", "loud"])
        .optional()
        .describe("Filter by maximum noise level"),
      type: z
        .enum(["library", "study_room", "lounge", "lab", "outdoor", "hidden_gem"])
        .optional()
        .describe("Filter by space type"),
      building: z.string().optional().describe("Match against building name (case-insensitive substring)"),
      amenity: z
        .string()
        .optional()
        .describe("Required amenity, e.g. 'Wi-Fi', 'Power Outlets', 'Whiteboard', 'Printers'"),
      limit: z.number().int().min(1).max(20).optional().describe("Max results to return (default 8)"),
    }),
    execute: async ({ noise, type, building, amenity, limit = 8 }) => {
      const noiseRank: Record<string, number> = { silent: 0, quiet: 1, moderate: 2, loud: 3 };

      let results = initialSpaces.filter((s) => {
        if (noise && noiseRank[s.noise] > noiseRank[noise]) return false;
        if (type && s.type !== type) return false;
        if (building && !ciIncludes(s.building, building)) return false;
        if (amenity && !s.amenities.some((a) => ciIncludes(a, amenity))) return false;
        return true;
      });

      results = results.slice(0, limit);
      if (results.length === 0)
        return { found: 0, message: "No study spaces matched. Try loosening filters." };

      return {
        found: results.length,
        spaces: results.map((s) => ({
          id: s.id,
          name: s.name,
          building: s.building,
          floor: s.floor,
          address: s.address,
          noise: s.noise,
          type: s.type,
          amenities: s.amenities,
          hours: s.hours,
          capacity: s.capacity,
          tip: s.tip,
        })),
      };
    },
  }),

  searchListings: tool({
    description:
      "Search the Violet Exchange marketplace. Returns title, category, price, condition, seller, and how recently it was posted.",
    inputSchema: z.object({
      category: z
        .enum(["Textbooks", "Furniture", "Meal Swipes", "Electronics", "Other"])
        .optional()
        .describe("Filter by category"),
      query: z.string().optional().describe("Match against listing title (case-insensitive substring)"),
      freeOnly: z.boolean().optional().describe("Only return free items"),
      limit: z.number().int().min(1).max(20).optional().describe("Max results to return (default 8)"),
    }),
    execute: async ({ category, query, freeOnly, limit = 8 }) => {
      let results = initialListings.filter((l) => {
        if (category && l.category !== category) return false;
        if (query && !ciIncludes(l.title, query)) return false;
        if (freeOnly && l.price.toLowerCase() !== "free") return false;
        return true;
      });

      results = results.slice(0, limit);
      if (results.length === 0)
        return { found: 0, message: "No listings matched. Try broadening the search." };

      return { found: results.length, listings: results };
    },
  }),

  searchMentors: tool({
    description:
      "Find peer mentors. Returns name, major, topics, rating, session count, availability, and bio. Topics include things like 'Interview Prep', 'MCAT Prep', 'Machine Learning', specific courses.",
    inputSchema: z.object({
      topic: z
        .string()
        .optional()
        .describe(
          "Match against any of the mentor's topics (case-insensitive substring). E.g. 'machine learning', 'interview', 'mcat'"
        ),
      majorIncludes: z
        .string()
        .optional()
        .describe("Match against the mentor's major (case-insensitive substring), e.g. 'Computer Science'"),
      availableOnly: z.boolean().optional().describe("Only return mentors currently available"),
      limit: z.number().int().min(1).max(20).optional().describe("Max results (default 6)"),
    }),
    execute: async ({ topic, majorIncludes, availableOnly, limit = 6 }) => {
      let results = initialMentors.filter((m) => {
        if (availableOnly && !m.available) return false;
        if (topic && !m.topics.some((t) => ciIncludes(t, topic))) return false;
        if (majorIncludes && !ciIncludes(m.major, majorIncludes)) return false;
        return true;
      });

      results = results.slice(0, limit);
      if (results.length === 0)
        return { found: 0, message: "No mentors matched. Try broader topics." };

      return { found: results.length, mentors: results };
    },
  }),

  checkPrinters: tool({
    description:
      "Check NYU print station status. Each printer has a status ('working', 'not_working', or 'unknown'), a building, floor, type (B&W or Color Laser), and when it was last reported. A printer is 'stale' if no one has reported in over 48 hours.",
    inputSchema: z.object({
      status: z
        .enum(["working", "not_working", "unknown"])
        .optional()
        .describe("Filter by status"),
      building: z.string().optional().describe("Match against building (case-insensitive substring)"),
      colorOnly: z.boolean().optional().describe("Only return color laser printers"),
      limit: z.number().int().min(1).max(30).optional().describe("Max results (default 15)"),
    }),
    execute: async ({ status, building, colorOnly, limit = 15 }) => {
      let results = initialPrinters.filter((p) => {
        if (status && p.status !== status) return false;
        if (building && !ciIncludes(p.building, building)) return false;
        if (colorOnly && !ciIncludes(p.printer_type, "color")) return false;
        return true;
      });

      results = results.slice(0, limit);
      if (results.length === 0)
        return { found: 0, message: "No printers matched your filters." };

      return {
        found: results.length,
        printers: results.map((p) => ({
          id: p.id,
          name: p.name,
          building: p.building,
          floor: p.floor,
          type: p.printer_type,
          status: p.status,
          lastUpdated: p.last_updated,
          stale: isStale(p.last_updated),
          lastReportedBy: p.last_reported_by,
        })),
      };
    },
  }),

  listHiddenGems: tool({
    description:
      "List user-submitted 'hidden gem' study spots — lesser-known places students have shared. Use when the user wants to discover something off the beaten path.",
    inputSchema: z.object({
      limit: z.number().int().min(1).max(20).optional().describe("Max results (default 8)"),
    }),
    execute: async ({ limit = 8 }) => {
      const results = initialSpaces
        .filter((s) => s.type === "hidden_gem")
        .slice(0, limit);

      if (results.length === 0)
        return { found: 0, message: "No hidden gems submitted yet." };

      return {
        found: results.length,
        spaces: results.map((s) => ({
          id: s.id,
          name: s.name,
          building: s.building,
          floor: s.floor,
          noise: s.noise,
          amenities: s.amenities,
          hours: s.hours,
          tip: s.tip,
          submittedBy: s.submittedBy,
        })),
      };
    },
  }),

  findNearbyPrinters: tool({
    description:
      "Find printers near a building or landmark. Use when a student says something like 'is there a printer near Bobst' or 'closest printer to Tandon'. Matches the building name (case-insensitive substring).",
    inputSchema: z.object({
      landmark: z
        .string()
        .describe("Building or landmark name to match against, e.g. 'Bobst', 'Tandon', 'Kimmel'"),
      workingOnly: z
        .boolean()
        .optional()
        .describe("Only return printers reported as working"),
      limit: z.number().int().min(1).max(15).optional().describe("Max results (default 5)"),
    }),
    execute: async ({ landmark, workingOnly, limit = 5 }) => {
      let results = initialPrinters.filter(
        (p) =>
          ciIncludes(p.building, landmark) ||
          ciIncludes(p.name, landmark)
      );
      if (workingOnly) results = results.filter((p) => p.status === "working");
      results = results.slice(0, limit);

      if (results.length === 0)
        return {
          found: 0,
          message: `No printers found near "${landmark}". Try a different landmark.`,
        };

      return {
        found: results.length,
        printers: results.map((p) => ({
          id: p.id,
          name: p.name,
          building: p.building,
          floor: p.floor,
          type: p.printer_type,
          status: p.status,
          stale: isStale(p.last_updated),
        })),
      };
    },
  }),

  listStalePrinters: tool({
    description:
      "List printers whose status hasn't been reported in over 48 hours. Use to nudge the user to verify a printer if they're nearby, or when they ask which printers need attention.",
    inputSchema: z.object({
      limit: z.number().int().min(1).max(20).optional().describe("Max results (default 10)"),
    }),
    execute: async ({ limit = 10 }) => {
      const results = initialPrinters
        .filter((p) => isStale(p.last_updated))
        .slice(0, limit);

      if (results.length === 0)
        return { found: 0, message: "All printers have recent reports — nothing stale." };

      return {
        found: results.length,
        printers: results.map((p) => ({
          id: p.id,
          name: p.name,
          building: p.building,
          floor: p.floor,
          type: p.printer_type,
          lastStatus: p.status,
          lastUpdated: p.last_updated,
        })),
      };
    },
  }),

  navigateTo: tool({
    description:
      "Suggest an in-app navigation. Call this AFTER answering the user when there's a natural follow-up action they'd want to take in the UI: viewing all results in a tab, submitting a hidden gem, listing an item for sale, reporting a printer issue, etc. The UI renders this as a clickable button.",
    inputSchema: z.object({
      tab: z
        .enum(["spaces", "exchange", "mentoring", "printers", "home"])
        .describe("Which tab to link to"),
      label: z
        .string()
        .optional()
        .describe(
          "Button label override. Default labels are 'Open Spaces', 'Open Violet Exchange', etc. Override when a more specific call-to-action fits, e.g. 'Submit a hidden gem', 'Report this printer'."
        ),
    }),
    execute: async ({ tab, label }) => {
      const map: Record<string, { href: string; default: string }> = {
        home: { href: "/", default: "Open Chat" },
        spaces: { href: "/spaces", default: "Open Study Spaces" },
        exchange: { href: "/exchange", default: "Open Violet Exchange" },
        mentoring: { href: "/mentoring", default: "Open Peer Mentoring" },
        printers: { href: "/printers", default: "Open Printers" },
      };
      const m = map[tab];
      return { tab, href: m.href, label: label ?? m.default };
    },
  }),

  sharePrintCredits: tool({
    description:
      "Send NYU print credits to another student via email. Use only when the user explicitly asks to share or send credits and provides the recipient email and number of pages. Confirm details with the user before calling.",
    inputSchema: z.object({
      recipientEmail: z.string().email().describe("Recipient's email address"),
      pages: z.number().int().min(1).max(500).describe("Number of pages to share"),
      message: z.string().optional().describe("Optional personal message to include"),
    }),
    execute: async ({ recipientEmail, pages, message }) => {
      try {
        const { shareCreditsAction } = await import(
          "@/app/(dashboard)/printers/actions"
        );
        const result = await shareCreditsAction({ recipientEmail, pages, message });
        if (result.success) {
          return {
            success: true,
            message: `Sent ${pages} print credit${pages !== 1 ? "s" : ""} to ${recipientEmail}.`,
          };
        }
        return { success: false, error: result.error ?? "Failed to send credits." };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? `Sharing is currently unavailable: ${err.message}`
              : "Sharing is currently unavailable.",
        };
      }
    },
  }),
};
