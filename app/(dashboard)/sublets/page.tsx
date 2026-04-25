"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  X,
  BedDouble,
  CalendarRange,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Pencil,
  Send,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { SearchInput } from "@/app/components/search-input";
import { uploadSubletImageAction } from "./actions";

type GenderPref = "any" | "female" | "male" | "nonbinary";

type Sublet = {
  id: number;
  title: string;
  description: string;
  neighborhood: string;
  address: string;
  monthlyRent: number;
  utilitiesIncluded: boolean;
  leaseStart: string; // ISO
  leaseEnd: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  genderPref: GenderPref;
  imageUrls: string[];
  listerName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
};

type SortOption = "newest" | "rentLow" | "rentHigh" | "leaseStart";

const GENDER_OPTIONS: { value: GenderPref; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "nonbinary", label: "Non-binary" },
];

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatBedrooms(n: number): string {
  if (n === 0) return "Studio";
  if (n === 1) return "1 BR";
  return `${n} BR`;
}

const blankForm = {
  title: "",
  description: "",
  neighborhood: "",
  address: "",
  monthlyRent: "",
  utilitiesIncluded: false,
  leaseStart: "",
  leaseEnd: "",
  bedrooms: "0",
  bathrooms: "1",
  furnished: false,
  genderPref: "any" as GenderPref,
  imageUrls: [] as string[],
  listerName: "",
  contactEmail: "",
  contactPhone: "",
};

export default function SubletsPage() {
  const [sublets, setSublets] = useState<Sublet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("All");
  const [maxRent, setMaxRent] = useState<string>("");
  const [bedroomFilter, setBedroomFilter] = useState<string>("Any");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Sublet | null>(null);
  const [interestOpen, setInterestOpen] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────
  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch("/api/sublets", { cache: "no-store" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as { sublets: Sublet[] };
      setSublets(data.sublets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sublets");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    sublets.forEach((s) => set.add(s.neighborhood));
    return ["All", ...Array.from(set).sort()];
  }, [sublets]);

  const filtered = useMemo(() => {
    let list = sublets;
    if (neighborhoodFilter !== "All")
      list = list.filter((s) => s.neighborhood === neighborhoodFilter);
    if (bedroomFilter !== "Any") {
      if (bedroomFilter === "Studio") list = list.filter((s) => s.bedrooms === 0);
      else if (bedroomFilter === "3+") list = list.filter((s) => s.bedrooms >= 3);
      else list = list.filter((s) => s.bedrooms === Number(bedroomFilter));
    }
    if (maxRent) {
      const cap = Number(maxRent);
      if (Number.isFinite(cap)) list = list.filter((s) => s.monthlyRent <= cap);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.neighborhood.toLowerCase().includes(q) ||
          s.listerName.toLowerCase().includes(q),
      );
    }

    const sorted = [...list];
    if (sortBy === "rentLow") sorted.sort((a, b) => a.monthlyRent - b.monthlyRent);
    else if (sortBy === "rentHigh") sorted.sort((a, b) => b.monthlyRent - a.monthlyRent);
    else if (sortBy === "leaseStart")
      sorted.sort((a, b) => a.leaseStart.localeCompare(b.leaseStart));
    return sorted;
  }, [sublets, neighborhoodFilter, bedroomFilter, maxRent, searchQuery, sortBy]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openCreateForm() {
    setEditingId(null);
    setForm(blankForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(s: Sublet) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      description: s.description,
      neighborhood: s.neighborhood,
      address: s.address,
      monthlyRent: String(s.monthlyRent),
      utilitiesIncluded: s.utilitiesIncluded,
      leaseStart: s.leaseStart,
      leaseEnd: s.leaseEnd,
      bedrooms: String(s.bedrooms),
      bathrooms: String(s.bathrooms),
      furnished: s.furnished,
      genderPref: s.genderPref,
      imageUrls: s.imageUrls,
      listerName: s.listerName,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (f) => {
          const fd = new FormData();
          fd.append("file", f);
          return uploadSubletImageAction(fd);
        }),
      );
      const newUrls = uploads
        .filter(
          (u): u is { success: true; result: { url: string; fileName: string; size: number } } =>
            u.success,
        )
        .map((u) => u.result.url);
      const failed = uploads.filter((u) => !u.success).length;
      if (newUrls.length > 0) {
        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
      }
      if (failed > 0) {
        setFormError(`${failed} image(s) failed to upload (likely too big or wrong type)`);
      }
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImageAt(idx: number) {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        neighborhood: form.neighborhood.trim(),
        address: form.address.trim() || undefined,
        monthlyRent: Number(form.monthlyRent),
        utilitiesIncluded: form.utilitiesIncluded,
        leaseStart: form.leaseStart,
        leaseEnd: form.leaseEnd,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        furnished: form.furnished,
        genderPref: form.genderPref,
        imageUrls: form.imageUrls,
        listerName: form.listerName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
      };

      const url = editingId ? `/api/sublets/${editingId}` : "/api/sublets";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Status ${res.status}`);
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Take down this sublet listing?")) return;
    const res = await fetch(`/api/sublets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelected(null);
      await refresh();
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sublets &amp; housing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find and post short-term rentals from fellow NYU students. No spam,
            no ghost-leases.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Post Sublet
        </button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, neighborhood, or lister…"
        />
        <select
          value={neighborhoodFilter}
          onChange={(e) => setNeighborhoodFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select
          value={bedroomFilter}
          onChange={(e) => setBedroomFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {["Any", "Studio", "1", "2", "3+"].map((b) => (
            <option key={b} value={b}>{b === "Any" ? "Any beds" : b === "Studio" ? "Studio" : `${b} BR`}</option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          placeholder="Max rent"
          value={maxRent}
          onChange={(e) => setMaxRent(e.target.value)}
          className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="rentLow">Rent: Low → High</option>
          <option value="rentHigh">Rent: High → Low</option>
          <option value="leaseStart">Lease starts soonest</option>
        </select>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading sublets…</p>
      )}
      {error && (
        <p className="text-sm text-red-600">Failed to load: {error}</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No sublets match your filters. Try widening the search.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="flex cursor-pointer flex-col rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
            onClick={() => setSelected(s)}
          >
            {/* Optional first image */}
            {s.imageUrls.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.imageUrls[0]}
                alt=""
                className="mb-3 h-32 w-full rounded-md object-cover"
              />
            ) : (
              <div className="mb-3 flex h-20 items-center justify-center rounded-md bg-secondary/40">
                <BedDouble className="h-7 w-7 text-muted-foreground/40" />
              </div>
            )}

            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="font-medium leading-snug">{s.title}</h3>
              <span className="shrink-0 text-sm font-semibold">
                ${s.monthlyRent}/mo
              </span>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {s.neighborhood}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                {formatBedrooms(s.bedrooms)} · {s.bathrooms} ba
              </span>
              {s.furnished && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                  Furnished
                </span>
              )}
              {s.utilitiesIncluded && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                  Utilities incl.
                </span>
              )}
            </div>

            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarRange className="h-3 w-3" />
              {formatDate(s.leaseStart)} → {formatDate(s.leaseEnd)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">— {s.listerName}</p>
          </div>
        ))}
      </div>

      {/* ── Details + interest modal ──────────────────────────────────────── */}
      {selected && !interestOpen && (
        <DetailsModal
          sublet={selected}
          onClose={() => setSelected(null)}
          onContact={() => setInterestOpen(true)}
          onEdit={() => {
            const s = selected;
            setSelected(null);
            openEditForm(s);
          }}
          onDelete={() => handleDelete(selected.id)}
        />
      )}

      {selected && interestOpen && (
        <InterestModal
          sublet={selected}
          onClose={() => {
            setInterestOpen(false);
            setSelected(null);
          }}
          onBack={() => setInterestOpen(false)}
        />
      )}

      {/* ── Form modal ────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={handleSubmitForm}
            className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Sublet" : "Post a Sublet"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title *">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Cozy studio off Washington Sq"
                  className="form-in"
                />
              </Field>

              <Field label="Neighborhood *">
                <input
                  required
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  placeholder="East Village"
                  className="form-in"
                />
              </Field>

              <Field label="Address (optional)" className="md:col-span-2">
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="cross-street or building"
                  className="form-in"
                />
              </Field>

              <Field label="Monthly rent ($) *">
                <input
                  required
                  type="number"
                  min={0}
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                  className="form-in"
                />
              </Field>

              <Field label="Utilities">
                <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.utilitiesIncluded}
                    onChange={(e) =>
                      setForm({ ...form, utilitiesIncluded: e.target.checked })
                    }
                  />
                  Included in rent
                </label>
              </Field>

              <Field label="Lease start *">
                <input
                  required
                  type="date"
                  value={form.leaseStart}
                  onChange={(e) => setForm({ ...form, leaseStart: e.target.value })}
                  className="form-in"
                />
              </Field>

              <Field label="Lease end *">
                <input
                  required
                  type="date"
                  value={form.leaseEnd}
                  onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })}
                  className="form-in"
                />
              </Field>

              <Field label="Bedrooms *">
                <select
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  className="form-in"
                >
                  <option value="0">Studio</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </Field>

              <Field label="Bathrooms *">
                <select
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                  className="form-in"
                >
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3+</option>
                </select>
              </Field>

              <Field label="Furnished">
                <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.furnished}
                    onChange={(e) => setForm({ ...form, furnished: e.target.checked })}
                  />
                  Yes
                </label>
              </Field>

              <Field label="Roommate preference">
                <select
                  value={form.genderPref}
                  onChange={(e) =>
                    setForm({ ...form, genderPref: e.target.value as GenderPref })
                  }
                  className="form-in"
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Description *" className="md:col-span-2">
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Why you're subletting, what's nearby, building amenities, etc."
                  className="form-in resize-none"
                />
              </Field>

              <Field
                label={`Photos (${form.imageUrls.length}${form.imageUrls.length === 1 ? "" : ""})`}
                className="md:col-span-2"
              >
                <div className="space-y-2">
                  {form.imageUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {form.imageUrls.map((url, i) => (
                        <div
                          key={`${url}-${i}`}
                          className="group relative h-24 overflow-hidden rounded-md border border-border bg-secondary/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImageAt(i)}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    <span>
                      {uploadingImage
                        ? "Uploading…"
                        : form.imageUrls.length === 0
                        ? "Add photos (≤10 MB each, multiple OK)"
                        : "Add more photos"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void handleImageUpload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </Field>

              <Field label="Your name *">
                <input
                  required
                  value={form.listerName}
                  onChange={(e) => setForm({ ...form, listerName: e.target.value })}
                  className="form-in"
                />
              </Field>

              <Field label="Contact email *">
                <input
                  required
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="form-in"
                />
              </Field>

              <Field label="Contact phone (optional)" className="md:col-span-2">
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="form-in"
                />
              </Field>
            </div>

            {formError && (
              <p className="mt-3 text-sm text-red-600">{formError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {submitting ? "Saving…" : editingId ? "Save changes" : "Post sublet"}
              </button>
            </div>

            <style jsx>{`
              :global(.form-in) {
                width: 100%;
                border-radius: 0.375rem;
                border: 1px solid hsl(var(--border));
                background: var(--background);
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
              }
              :global(.form-in:focus) {
                outline: 2px solid hsl(var(--ring));
                outline-offset: 0;
              }
            `}</style>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailsModal({
  sublet,
  onClose,
  onContact,
  onEdit,
  onDelete,
}: {
  sublet: Sublet;
  onClose: () => void;
  onContact: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{sublet.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {sublet.neighborhood}
              {sublet.address ? ` · ${sublet.address}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {sublet.imageUrls.length > 0 && (
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {sublet.imageUrls.slice(0, 4).map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt="" className="h-40 w-full rounded-md object-cover" />
            ))}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary">
            ${sublet.monthlyRent}/mo
          </span>
          <span className="rounded-md bg-secondary px-2.5 py-1 text-secondary-foreground">
            {formatBedrooms(sublet.bedrooms)} · {sublet.bathrooms} ba
          </span>
          {sublet.furnished && (
            <span className="rounded-md bg-secondary px-2.5 py-1 text-secondary-foreground">
              Furnished
            </span>
          )}
          {sublet.utilitiesIncluded && (
            <span className="rounded-md bg-secondary px-2.5 py-1 text-secondary-foreground">
              Utilities incl.
            </span>
          )}
          {sublet.genderPref !== "any" && (
            <span className="rounded-md bg-secondary px-2.5 py-1 text-secondary-foreground">
              {sublet.genderPref} roommate
            </span>
          )}
        </div>

        <p className="mb-4 flex items-center gap-1.5 text-sm">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          {formatDate(sublet.leaseStart)} → {formatDate(sublet.leaseEnd)}
        </p>

        <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed">
          {sublet.description}
        </p>

        <div className="mb-5 rounded-md border border-border bg-secondary/30 p-3 text-sm">
          <p className="font-medium">{sublet.listerName}</p>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {sublet.contactEmail}
          </p>
          {sublet.contactPhone && (
            <p className="mt-0.5 flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {sublet.contactPhone}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Take down
            </button>
          </div>
          <button
            onClick={onContact}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
            Express interest
          </button>
        </div>
      </div>
    </div>
  );
}

function InterestModal({
  sublet,
  onClose,
  onBack,
}: {
  sublet: Sublet;
  onClose: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [desiredStart, setDesiredStart] = useState("");
  const [desiredEnd, setDesiredEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/sublets/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subletId: sublet.id,
          subletTitle: sublet.title,
          listerName: sublet.listerName,
          listerEmail: sublet.contactEmail,
          interestedName: name,
          interestedEmail: email,
          interestedPhone: phone || undefined,
          message,
          desiredStart: desiredStart || undefined,
          desiredEnd: desiredEnd || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Status ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Email the lister</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {sublet.title} — {sublet.listerName}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
            ✓ Sent. {sublet.listerName} will reach out at {email}.
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3 text-sm">
            <Field label="Your name *">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-in"
              />
            </Field>
            <Field label="Your email *">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-in"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-in"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desired move-in (optional)">
                <input
                  type="date"
                  value={desiredStart}
                  onChange={(e) => setDesiredStart(e.target.value)}
                  className="form-in"
                />
              </Field>
              <Field label="Desired move-out (optional)">
                <input
                  type="date"
                  value={desiredEnd}
                  onChange={(e) => setDesiredEnd(e.target.value)}
                  className="form-in"
                />
              </Field>
            </div>
            <Field label="Message *">
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! Saw your sublet — is it still available?"
                className="form-in resize-none"
              />
            </Field>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
