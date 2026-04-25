import { Tag, BookOpen, Sofa, UtensilsCrossed, Plus } from "lucide-react";
import { initialListings as listings } from "./listingsData";

const categoryIcons: Record<string, typeof BookOpen> = {
  Textbooks: BookOpen,
  Furniture: Sofa,
  "Meal Swipes": UtensilsCrossed,
};

export default function ExchangePage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Violet Exchange</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buy, sell, and trade within the NYU community. Textbooks, furniture,
            meal swipes, and more.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          List Item
        </button>
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "Textbooks", "Furniture", "Meal Swipes", "Electronics", "Other"].map(
          (cat) => (
            <button
              key={cat}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                cat === "All"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Listings grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((item) => {
          const Icon = categoryIcons[item.category] ?? Tag;
          return (
            <div
              key={item.title}
              className="flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              {/* Placeholder image area */}
              <div className="mb-4 flex h-32 items-center justify-center rounded-md bg-secondary/50">
                <Icon className="h-8 w-8 text-muted-foreground/50" />
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.category}
                  </span>
                  <span
                    className={`text-sm font-semibold ${item.price === "Free" ? "text-green-600" : ""}`}
                  >
                    {item.price}
                  </span>
                </div>
                <h3 className="mb-2 font-medium leading-snug">{item.title}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.seller}</span>
                  <span>{item.posted}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
