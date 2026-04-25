export type ListingCategory =
  | "Textbooks"
  | "Furniture"
  | "Meal Swipes"
  | "Electronics"
  | "Other";

export type ListingCondition = "Like New" | "Good" | "Fair" | "N/A";

export interface Listing {
  title: string;
  category: ListingCategory;
  price: string;
  condition: ListingCondition;
  seller: string;
  posted: string;
}

export const initialListings: Listing[] = [
  {
    title: "Calculus: Early Transcendentals (8th Ed)",
    category: "Textbooks",
    price: "$35",
    condition: "Good",
    seller: "Alex M.",
    posted: "2 hours ago",
  },
  {
    title: "IKEA KALLAX Shelf Unit",
    category: "Furniture",
    price: "$40",
    condition: "Like New",
    seller: "Jordan K.",
    posted: "5 hours ago",
  },
  {
    title: "5 Meal Swipes - Lipton",
    category: "Meal Swipes",
    price: "$20",
    condition: "N/A",
    seller: "Sam R.",
    posted: "1 hour ago",
  },
  {
    title: "Introduction to Algorithms (CLRS)",
    category: "Textbooks",
    price: "$25",
    condition: "Fair",
    seller: "Priya D.",
    posted: "1 day ago",
  },
  {
    title: "Desk Lamp - LED Adjustable",
    category: "Furniture",
    price: "Free",
    condition: "Good",
    seller: "Chris T.",
    posted: "3 hours ago",
  },
  {
    title: "10 Meal Swipes - Palladium",
    category: "Meal Swipes",
    price: "$35",
    condition: "N/A",
    seller: "Maya L.",
    posted: "30 min ago",
  },
];
