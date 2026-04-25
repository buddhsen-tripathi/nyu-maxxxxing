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
  noise: text("noise").notNull(), // "Silent" | "Low" | "Moderate" | "Loud"
  tags: text("tags").array().notNull(), // ["Quiet", "Wi-Fi", "Power Outlets", ...]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Exchange Listings ──
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "Textbooks" | "Furniture" | "Meal Swipes" | "Electronics" | "Other"
  price: text("price").notNull(), // "Free", "$35", etc.
  condition: text("condition"), // "Like New" | "Good" | "Fair" | "N/A"
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
  name: text("name").notNull(),
  building: text("building").notNull(),
  floor: text("floor").notNull(),
  type: text("type").notNull(), // "B&W Laser" | "Color Laser"
  status: text("status").default("online").notNull(), // "online" | "offline" | "issue"
  issue: text("issue"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Printer Issue Reports (crowd-sourced) ──
export const printerReports = pgTable("printer_reports", {
  id: serial("id").primaryKey(),
  printerId: integer("printer_id")
    .references(() => printers.id)
    .notNull(),
  issue: text("issue").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
