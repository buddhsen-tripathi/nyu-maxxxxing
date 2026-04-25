import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const notes = [
  {
    type: "heads_up",
    title: "Bobst 4F printer out of toner",
    body: "Color printer on Bobst 4th floor has been out of toner since this morning. Use the B&W one on the same floor or head to LL2.",
    authorName: "Priya D.",
    location: "Bobst Library — 4th Floor",
    upvotes: 12,
  },
  {
    type: "working",
    title: "Paulson Center 2F is super quiet right now",
    body: "Just got here, maybe 5 people on the whole floor. Outlets working, AC isn't blasting. Great for focused work this afternoon.",
    authorName: "Jin H.",
    location: "Paulson Center",
    upvotes: 28,
  },
  {
    type: "event",
    title: "Free pizza in Kimmel atrium tonight 7pm",
    body: "Student government is hosting a meet & greet for new transfers. Free Joe's pizza, soft drinks. Open to all undergrads.",
    authorName: "Marcus J.",
    location: "Kimmel Center — Atrium",
    upvotes: 45,
  },
  {
    type: "suggestion",
    title: "We should crowdsource a 'best bathroom' map",
    body: "There are like 4 genuinely nice bathrooms on campus and the rest are tragic. Someone should make this a feature on Maxxxxing.",
    authorName: "Sarah C.",
    location: "",
    upvotes: 67,
  },
  {
    type: "heads_up",
    title: "L train running on weekend schedule until April 30",
    body: "If you commute via the L, expect ~15 min delays through the weekend. Manhattan-bound trains skipping Bedford after 11pm.",
    authorName: "Diego R.",
    location: "L Train",
    upvotes: 19,
  },
  {
    type: "working",
    title: "New espresso machine in Tandon café is amazing",
    body: "They finally replaced the broken one. Lattes are actually drinkable now. Get there before the 10am rush.",
    authorName: "Alex M.",
    location: "Tandon — 6 MetroTech",
    upvotes: 34,
  },
  {
    type: "event",
    title: "CS-UY 2124 study group every Wed 6pm",
    body: "Weekly study group for OOP, in Dibner 3F study room. Open to anyone in the class. We work through the homework together and quiz each other before exams.",
    authorName: "Raj K.",
    location: "Dibner — 3rd Floor",
    upvotes: 21,
  },
  {
    type: "suggestion",
    title: "Add late-night study spot tags",
    body: "Spaces tab should let me filter for places open after midnight. Bobst 24/7 access during finals would be a great tag too.",
    authorName: "",
    location: "",
    upvotes: 14,
  },
  {
    type: "heads_up",
    title: "WSP fountain area construction through May",
    body: "Heads up: the central fountain area is fenced off for repairs. Annoying detour but the rest of the park is fine for studying outside.",
    authorName: "Maya L.",
    location: "Washington Square Park",
    upvotes: 8,
  },
  {
    type: "working",
    title: "MakerSpace 3D printers all functional this week",
    body: "Both Prusas and the Bambu are running. Ender is still down. Submit jobs through the portal, queue is short right now.",
    authorName: "Jordan K.",
    location: "Tandon MakerSpace",
    upvotes: 17,
  },
];

console.log(`Inserting ${notes.length} community notes...`);

for (const note of notes) {
  await sql`
    INSERT INTO community_notes (type, title, body, author_name, location, upvotes, active)
    VALUES (
      ${note.type}, ${note.title}, ${note.body},
      ${note.authorName || null}, ${note.location || null},
      ${note.upvotes}, true
    )
  `;
  console.log(`  ✓ [${note.type}] ${note.title}`);
}

console.log("Done.");
