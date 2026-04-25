import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const dummyListings = [
  {
    title: "Calculus: Early Transcendentals (8th Ed)",
    description: "Used for Calc I & II at Tandon. Light highlighting in early chapters, otherwise clean. Pickup near MetroTech.",
    category: "Textbooks",
    price: "$35",
    condition: "Good",
    sellerName: "Alex M.",
    contactEmail: "alex.m@nyu.edu",
    contactPhone: "(212) 555-0142",
    imageUrls: [
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "Introduction to Algorithms (CLRS, 3rd Ed)",
    description: "Hardcover. Some wear on the spine but pages are clean. Required for CS-UY 2413.",
    category: "Textbooks",
    price: "$25",
    condition: "Fair",
    sellerName: "Priya D.",
    contactEmail: "priya.d@nyu.edu",
    contactPhone: "(917) 555-0188",
    imageUrls: [
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "Linear Algebra Done Right (Axler, 4th Ed)",
    description: "Like new — barely opened. Switched majors. Selling cheap.",
    category: "Textbooks",
    price: "$30",
    condition: "Like New",
    sellerName: "Jin H.",
    contactEmail: "jin.h@nyu.edu",
    contactPhone: "(646) 555-0119",
    imageUrls: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "IKEA KALLAX 4x4 Shelf Unit (White)",
    description: "Disassembled, all hardware included. You pick up at Stuy Town. Great for dorm rooms.",
    category: "Furniture",
    price: "$40",
    condition: "Like New",
    sellerName: "Jordan K.",
    contactEmail: "jordan.k@nyu.edu",
    contactPhone: "(212) 555-0167",
    imageUrls: [
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "Adjustable LED Desk Lamp",
    description: "USB-powered, three brightness levels. Free to a good home, moving out next week.",
    category: "Furniture",
    price: "Free",
    condition: "Good",
    sellerName: "Chris T.",
    contactEmail: "chris.t@nyu.edu",
    contactPhone: "(347) 555-0103",
    imageUrls: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "Mini Fridge (1.7 cu ft, Black)",
    description: "Used one semester in Othmer. Works perfectly. Will deliver within Manhattan.",
    category: "Furniture",
    price: "$60",
    condition: "Good",
    sellerName: "Maya L.",
    contactEmail: "maya.l@nyu.edu",
    contactPhone: "(718) 555-0124",
    imageUrls: [
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "Ergonomic Mesh Office Chair",
    description: "Adjustable height & lumbar support. Bought from Staples last year. Pickup only — Brooklyn.",
    category: "Furniture",
    price: "$55",
    condition: "Good",
    sellerName: "Diego R.",
    contactEmail: "diego.r@nyu.edu",
    contactPhone: "(929) 555-0156",
    imageUrls: [
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "5 Meal Swipes — Lipton Hall",
    description: "Won't be on campus next week, happy to transfer 5 swipes. Venmo or Cashapp.",
    category: "Meal Swipes",
    price: "$20",
    condition: "N/A",
    sellerName: "Sam R.",
    contactEmail: "sam.r@nyu.edu",
    contactPhone: "(212) 555-0181",
    imageUrls: [
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "10 Meal Swipes — Palladium",
    description: "Ten swipes, transferring tonight. Message me on phone for fastest reply.",
    category: "Meal Swipes",
    price: "$35",
    condition: "N/A",
    sellerName: "Maya L.",
    contactEmail: "maya.l@nyu.edu",
    contactPhone: "(718) 555-0124",
    imageUrls: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "TI-84 Plus CE Graphing Calculator",
    description: "Used for one semester of stats. Comes with USB cable and original case.",
    category: "Electronics",
    price: "$70",
    condition: "Like New",
    sellerName: "Sarah C.",
    contactEmail: "sarah.c@nyu.edu",
    contactPhone: "(646) 555-0192",
    imageUrls: [
      "https://images.unsplash.com/photo-1574607383476-f517f260d30b?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "Sony WH-1000XM4 Wireless Headphones",
    description: "Bought last fall. Battery still excellent. Includes carry case and cables.",
    category: "Electronics",
    price: "$180",
    condition: "Good",
    sellerName: "Marcus J.",
    contactEmail: "marcus.j@nyu.edu",
    contactPhone: "(917) 555-0173",
    imageUrls: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "Yamaha F310 Acoustic Guitar",
    description: "Beginner-friendly. Comes with soft case and tuner. Slight wear but plays great.",
    category: "Other",
    price: "$90",
    condition: "Good",
    sellerName: "Raj K.",
    contactEmail: "raj.k@nyu.edu",
    contactPhone: "(212) 555-0145",
    imageUrls: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop",
    ],
  },
];

console.log(`Inserting ${dummyListings.length} listings...`);

for (const listing of dummyListings) {
  await sql`
    INSERT INTO listings (
      title, description, category, price, condition,
      seller_name, contact_email, contact_phone, image_urls, active
    ) VALUES (
      ${listing.title}, ${listing.description}, ${listing.category},
      ${listing.price}, ${listing.condition}, ${listing.sellerName},
      ${listing.contactEmail}, ${listing.contactPhone},
      ${listing.imageUrls}, true
    )
  `;
  console.log(`  ✓ ${listing.title}`);
}

console.log("Done.");
