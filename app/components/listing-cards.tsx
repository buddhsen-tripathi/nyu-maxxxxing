"use client";

import Link from "next/link";
import { ArrowRight, BedDouble, MapPin, Tag } from "lucide-react";

// Renderable shapes — keep loose so the agent's output shape variations don't break the UI.
type Sublet = {
  id?: number;
  title?: string;
  neighborhood?: string;
  monthlyRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  leaseStart?: string;
  leaseEnd?: string;
  imageUrls?: string[];
};

type Listing = {
  id?: number;
  title?: string;
  category?: string;
  price?: number | string; // API returns number; legacy fallback returns string
  condition?: string;
  seller?: string;
  imageUrls?: string[];
};

function shortDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function bedroomLabel(n: number | undefined): string {
  if (n === undefined) return "";
  if (n === 0) return "Studio";
  if (n === 1) return "1 BR";
  return `${n} BR`;
}

function priceLabel(p: number | string | undefined): string {
  if (p === undefined) return "";
  if (typeof p === "number") return p === 0 ? "Free" : `$${p}`;
  return p;
}

// ─── Sublets ────────────────────────────────────────────────────────────────

export function SubletCardScroll({ sublets }: { sublets: Sublet[] }) {
  if (sublets.length === 0) return null;
  return (
    <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-2 pl-1 pr-2">
      {sublets.map((s, i) => (
        <Link
          href="/sublets"
          key={s.id ?? i}
          className="group flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
        >
          {s.imageUrls && s.imageUrls.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.imageUrls[0]}
              alt=""
              className="h-32 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-32 items-center justify-center bg-secondary/40">
              <BedDouble className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-1 p-3">
            <div className="flex items-start justify-between gap-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug">
                {s.title ?? "Untitled"}
              </p>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{s.neighborhood ?? "—"}</span>
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <span className="text-sm font-semibold">
                {s.monthlyRent !== undefined ? `$${s.monthlyRent}/mo` : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                {bedroomLabel(s.bedrooms)}
                {s.bathrooms !== undefined && s.bathrooms > 0 && s.bedrooms !== undefined
                  ? ` · ${s.bathrooms}ba`
                  : ""}
              </span>
            </div>
            {(s.leaseStart || s.leaseEnd) && (
              <p className="text-xs text-muted-foreground">
                {shortDate(s.leaseStart)} → {shortDate(s.leaseEnd)}
              </p>
            )}
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View on Sublets <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Exchange listings ──────────────────────────────────────────────────────

export function ListingCardScroll({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) return null;
  return (
    <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-2 pl-1 pr-2">
      {listings.map((l, i) => (
        <Link
          href="/exchange"
          key={l.id ?? i}
          className="group flex w-52 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
        >
          {l.imageUrls && l.imageUrls.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={l.imageUrls[0]}
              alt=""
              className="h-32 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-32 items-center justify-center bg-secondary/40">
              <Tag className="h-7 w-7 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-1 p-3">
            <p className="line-clamp-2 text-sm font-medium leading-snug">
              {l.title ?? "Untitled"}
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <span
                className={`text-sm font-semibold ${
                  priceLabel(l.price) === "Free" ? "text-green-600" : ""
                }`}
              >
                {priceLabel(l.price)}
              </span>
              {l.condition && (
                <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                  {l.condition}
                </span>
              )}
            </div>
            <p className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{l.seller ?? ""}</span>
              <span className="shrink-0">{l.category ?? ""}</span>
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View on Exchange <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
