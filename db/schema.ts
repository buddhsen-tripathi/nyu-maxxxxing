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
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
