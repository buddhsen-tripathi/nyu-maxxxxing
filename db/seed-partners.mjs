import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

// The 8 hardcoded listings on /partner — seed these so the agent's
// searchPartners tool returns what users actually see on the page.
const staticListings = [
  {
    activity: "Gym Partner",
    seeking: "partner",
    description:
      "Looking for a gym buddy to hit the weights and cardio sessions 3-4 times a week. Preferably mornings or evenings.",
    time: "Weekdays 7-9 AM or 5-7 PM",
    location: "NYU Palladium Fitness Center",
    name: "Alex M.",
    contact: "alex.m@nyu.edu",
  },
  {
    activity: "Study Group",
    seeking: "group",
    description:
      "Forming a study group for CS algorithms course. Looking for 3-4 more people to meet twice a week.",
    time: "Tuesdays & Thursdays 3-5 PM",
    location: "Bobst Library Study Rooms",
    name: "Jordan K.",
    contact: "jordan.k@nyu.edu",
  },
  {
    activity: "Basketball",
    seeking: "group",
    description:
      "Looking for players to join casual pickup games at the gym. All skill levels welcome! Need 4-6 more players.",
    time: "Weekends 2-4 PM",
    location: "NYU Coles Sports Center",
    name: "Sam R.",
    contact: "sam.r@nyu.edu",
  },
  {
    activity: "Running Partner",
    seeking: "partner",
    description:
      "Seeking a running buddy for morning runs around Washington Square Park. 5-6 miles pace.",
    time: "Weekdays 6-7 AM",
    location: "Washington Square Park",
    name: "Priya D.",
    contact: "priya.d@nyu.edu",
  },
  {
    activity: "Language Exchange",
    seeking: "group",
    description:
      "Want to practice Spanish conversation. Forming a small group of 4-5 people for weekly meetups.",
    time: "Fridays 4-6 PM",
    location: "Kimmel Center Student Lounge",
    name: "Carlos L.",
    contact: "carlos.l@nyu.edu",
  },
  {
    activity: "Yoga Sessions",
    seeking: "group",
    description:
      "Looking for people interested in group yoga sessions. Beginner-friendly, focus on mindfulness. Seeking 5-8 participants.",
    time: "Saturdays 9-10:30 AM",
    location: "Washington Square Park",
    name: "Maya T.",
    contact: "maya.t@nyu.edu",
  },
  {
    activity: "Hiking Group",
    seeking: "group",
    description:
      "Planning weekend hikes in nearby areas. Looking for adventurous people to join our group of 6.",
    time: "Saturdays 8 AM - 2 PM",
    location: "Bear Mountain State Park",
    name: "David W.",
    contact: "david.w@nyu.edu",
  },
  {
    activity: "Cooking Club",
    seeking: "partner",
    description:
      "Looking for someone to cook meals with and try new recipes. Great for sharing costs and having fun in the kitchen.",
    time: "Evenings 7-9 PM",
    location: "Shared Kitchen in Residence Hall",
    name: "Emma S.",
    contact: "emma.s@nyu.edu",
  },
];

// Brand-new listings to broaden the variety.
const newListings = [
  {
    activity: "Rock Climbing",
    seeking: "group",
    description:
      "Heading to Brooklyn Boulders most Sundays. Looking for 2-3 people to share a day pass and rotate as belay partners. Top-rope and bouldering both welcome.",
    time: "Sundays 12-3 PM",
    location: "Brooklyn Boulders Gowanus",
    name: "Zoe P.",
    contact: "zoe.p@nyu.edu",
  },
  {
    activity: "Soccer Pickup",
    seeking: "group",
    description:
      "Casual pickup soccer at Pier 40. We have ~6 regulars and want to fill out a small-sided game. All levels.",
    time: "Sundays 10 AM - 12 PM",
    location: "Pier 40 Field",
    name: "Diego R.",
    contact: "diego.r@nyu.edu",
  },
  {
    activity: "Board Game Night",
    seeking: "group",
    description:
      "Catan, Codenames, Wingspan. Bring snacks and a game. Beginners 100% welcome — we explain rules.",
    time: "Fridays 7-10 PM",
    location: "Kimmel Center 4th Floor Lounge",
    name: "Hannah P.",
    contact: "hannah.p@nyu.edu",
  },
  {
    activity: "Photography Walks",
    seeking: "partner",
    description:
      "Looking for one photo buddy for street/architecture walks. I shoot Fuji X-T4, any camera works. Trade tips and locations.",
    time: "Saturdays 3-6 PM",
    location: "Brooklyn Bridge / DUMBO",
    name: "Yuki T.",
    contact: "yuki.t@nyu.edu",
  },
  {
    activity: "Korean Language Exchange",
    seeking: "group",
    description:
      "Native English speaker learning Korean — looking for 2-3 native or fluent Korean speakers wanting to practice English. Coffee + chat format.",
    time: "Wednesdays 5-6:30 PM",
    location: "Bobst Library 4th Floor",
    name: "Olivia M.",
    contact: "olivia.m@nyu.edu",
  },
  {
    activity: "Cycling Group",
    seeking: "group",
    description:
      "Long Saturday rides up the Hudson River Greenway. Riders should be comfortable with 25-40 miles at a 14-16 mph pace. Helmets and a working bike required.",
    time: "Saturdays 8 AM - 12 PM",
    location: "Hudson River Greenway (start at Pier 84)",
    name: "Marcus J.",
    contact: "marcus.j@nyu.edu",
  },
  {
    activity: "Climbing — NYU Wall",
    seeking: "partner",
    description:
      "Bouldering at the Coles bouldering wall. Want a regular partner to swap problems and push grades. V2-V4 range.",
    time: "Mon/Wed 7-9 PM",
    location: "NYU Coles Sports Center — Climbing Wall",
    name: "Jin H.",
    contact: "jin.h@nyu.edu",
  },
  {
    activity: "Stern Coffee Chats",
    seeking: "group",
    description:
      "Stern juniors prepping for IB recruiting. Mock behavioral interviews + technicals. We meet weekly and rotate who runs the session.",
    time: "Sundays 4-5:30 PM",
    location: "Stern KMC Lobby",
    name: "Raj K.",
    contact: "raj.k@nyu.edu",
  },
];

const allListings = [...staticListings, ...newListings];

console.log(`Seeding ${allListings.length} partner listings (skipping existing matches)...`);

let inserted = 0;
let skipped = 0;

for (const listing of allListings) {
  const existing = await sql`
    SELECT id FROM partners
    WHERE activity = ${listing.activity}
      AND name = ${listing.name}
      AND active = true
    LIMIT 1
  `;

  if (existing.length > 0) {
    console.log(`  · skip [${listing.activity}] ${listing.name} (already exists)`);
    skipped++;
    continue;
  }

  await sql`
    INSERT INTO partners (activity, seeking, description, time, location, name, contact, active)
    VALUES (
      ${listing.activity}, ${listing.seeking}, ${listing.description},
      ${listing.time}, ${listing.location}, ${listing.name}, ${listing.contact}, true
    )
  `;
  console.log(`  ✓ [${listing.activity}] ${listing.name}`);
  inserted++;
}

console.log(`\nInserted ${inserted}, skipped ${skipped}.`);
