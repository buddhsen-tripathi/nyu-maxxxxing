import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Study Spaces ──
export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  building: text("building").notNull(),
  capacity: text("capacity"),
  hours: text("hours"),
  noise: text("noise").notNull(),
  tags: text("tags").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Exchange Listings ──
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: text("price").notNull(),
  condition: text("condition"),
  sellerName: text("seller_name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  imageUrls: text("image_urls")
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Mentors ──
export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  major: text("major").notNull(),
  program: text("program").notNull().default(""),
  bio: text("bio").default("").notNull(),
  topics: text("topics").array().notNull(),
  rating: real("rating").default(5.0).notNull(),
  sessions: integer("sessions").default(0).notNull(),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Mentor Time Slots ──
export const mentorSlots = pgTable("mentor_slots", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => mentors.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(),        // ISO date e.g. "2026-04-28"
  startTime: text("start_time").notNull(), // e.g. "10:00 am"
  booked: boolean("booked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Bookings ──
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => mentors.id).notNull(),
  slotId: integer("slot_id").references(() => mentorSlots.id).notNull(),
  bookerName: text("booker_name").notNull(),
  bookerEmail: text("booker_email").notNull(),
  bookedAt: timestamp("booked_at").defaultNow().notNull(),
});

// ── Printers ──
export const printers = pgTable("printers", {
  id: serial("id").primaryKey(),
  // Human-readable stable key used as the UI id (e.g. "kimmel", "bobst")
  slug: text("slug").unique(),
  name: text("name").notNull(),
  building: text("building").notNull(),
  floor: text("floor").notNull(),
  printerType: text("printer_type").notNull().default("B&W Laser"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  // "working" | "not_working" | "unknown"
  status: text("status").default("unknown").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  lastReportedBy: text("last_reported_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Printer Status Reports (crowd-sourced) ──
export const printerReports = pgTable("printer_reports", {
  id: serial("id").primaryKey(),
  printerId: integer("printer_id")
    .references(() => printers.id)
    .notNull(),
  // "working" | "not_working"
  status: text("status").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Community Notes ──
export const communityNotes = pgTable("community_notes", {
  id: serial("id").primaryKey(),
  // "heads_up" | "working" | "suggestion" | "event"
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorName: text("author_name"),
  location: text("location"),
  upvotes: integer("upvotes").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Partner Listings ──
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  activity: text("activity").notNull(), // "Gym", "Study", "Sports", etc.
  seeking: text("seeking").notNull(), // "partner" | "group"
  description: text("description").notNull(),
  time: text("time").notNull(), // "Weekdays 6-8 PM", "Saturdays 10 AM", etc.
  location: text("location").notNull(), // "NYU Gym", "Washington Square Park", etc.
  name: text("name").notNull(),
  contact: text("contact").notNull(), // email or phone
  // Capacity tracking (organizer counts as 1 of max)
  maxParticipants: integer("max_participants").default(2).notNull(),
  participants: text("participants")
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Sublets / Housing ──
export const sublets = pgTable("sublets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // Location
  neighborhood: text("neighborhood").notNull(), // East Village, Greenwich Village, etc.
  address: text("address"), // optional cross-street or building
  // Pricing
  monthlyRent: integer("monthly_rent").notNull(),
  utilitiesIncluded: boolean("utilities_included").default(false).notNull(),
  // Lease window — ISO YYYY-MM-DD
  leaseStart: text("lease_start").notNull(),
  leaseEnd: text("lease_end").notNull(),
  // Apartment specs
  bedrooms: real("bedrooms").notNull(), // 0 = studio
  bathrooms: real("bathrooms").notNull(),
  furnished: boolean("furnished").default(false).notNull(),
  genderPref: text("gender_pref"), // null = any
  // Photos + contact
  imageUrls: text("image_urls").array().default(sql`'{}'::text[]`).notNull(),
  listerName: text("lister_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  // Lifecycle
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
