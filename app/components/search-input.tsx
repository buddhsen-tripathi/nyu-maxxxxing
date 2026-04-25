"use client";

import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Standard search input used across tabs. Same look as the printers tab:
 * leading magnifier icon, rounded card-bg input, trailing clear button when
 * non-empty.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: Props) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
