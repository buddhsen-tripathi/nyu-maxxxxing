import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  real,
} from "drizzle-orm/pg-core";

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
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Mentors ──
export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  major: text("major").notNull(),
  bio: text("bio").notNull(),
  topics: text("topics").array().notNull(),
  rating: real("rating").default(0).notNull(),
  sessions: integer("sessions").default(0).notNull(),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
