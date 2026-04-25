import { MapPin, Wifi, Volume2, Clock, Users } from "lucide-react";

const spaces = [
  {
    name: "Dibner Library - 5th Floor",
    building: "5 MetroTech Center",
    tags: ["Quiet", "Power Outlets", "Wi-Fi"],
    capacity: "~40 seats",
    hours: "8 AM - 11 PM",
    noise: "Silent",
  },
  {
    name: "Bobst Library - Study Pods",
    building: "70 Washington Sq S",
    tags: ["Bookable", "Enclosed", "Wi-Fi"],
    capacity: "4 per pod",
    hours: "7 AM - 1 AM",
    noise: "Silent",
  },
  {
    name: "Tandon MakerSpace Lounge",
    building: "6 MetroTech Center",
    tags: ["Group Work", "Whiteboards", "Wi-Fi"],
    capacity: "~20 seats",
    hours: "9 AM - 9 PM",
    noise: "Moderate",
  },
  {
    name: "Kimmel Center - 4th Floor",
    building: "60 Washington Sq S",
    tags: ["Casual", "Food Nearby", "Wi-Fi"],
    capacity: "~60 seats",
    hours: "7 AM - 11 PM",
    noise: "Moderate",
  },
  {
    name: "Paulson Center - Open Atrium",
    building: "370 Jay Street",
    tags: ["Natural Light", "Power Outlets", "Zoom-Friendly"],
    capacity: "~30 seats",
    hours: "8 AM - 10 PM",
    noise: "Low",
  },
  {
    name: "Washington Square Park (Benches)",
    building: "Outdoor",
    tags: ["Fresh Air", "No Outlets", "Casual"],
    capacity: "Plenty",
    hours: "6 AM - 1 AM",
    noise: "Loud",
  },
];

export default function SpacesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Find Your Space</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover the perfect study spot based on your needs -- quiet focus,
          group collab, or a quick Zoom call.
        </p>
      </div>

      {/* Filters placeholder */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "Quiet", "Group Work", "Zoom-Friendly", "Open Now"].map(
          (filter) => (
            <button
              key={filter}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                filter === "All"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-accent"
              }`}
            >
              {filter}
            </button>
          )
        )}
      </div>

      {/* Spaces grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <div
            key={space.name}
            className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-medium">{space.name}</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {space.building}
                </p>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {space.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {space.capacity}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {space.hours}
              </span>
              <span className="flex items-center gap-1">
                <Volume2 className="h-3 w-3" />
                {space.noise}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
