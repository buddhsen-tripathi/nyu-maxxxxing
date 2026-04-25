"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Plus,
  Search,
  Send,
  Sofa,
  Tag,
  UtensilsCrossed,
  X,
} from "lucide-react";

type Category = "Textbooks" | "Furniture" | "Meal Swipes" | "Electronics" | "Other";
type Condition = "Like New" | "Good" | "Fair" | "N/A";

type Listing = {
  id: number;
  title: string;
  description: string;
  category: Category;
  price: number;
  condition: Condition;
  seller: string;
  sellerEmail: string;
  sellerPhone: string;
  imageUrls: string[];
  createdAt: string;
};

type SortOption = "newest" | "priceLow" | "priceHigh";

const categories: Array<"All" | Category> = [
  "All",
  "Textbooks",
  "Furniture",
  "Meal Swipes",
  "Electronics",
  "Other",
];

const conditionOptions: Array<"All" | Condition> = ["All", "Like New", "Good", "Fair", "N/A"];

const categoryIcons: Record<Category, typeof BookOpen> = {
  Textbooks: BookOpen,
  Furniture: Sofa,
  "Meal Swipes": UtensilsCrossed,
  Electronics: Tag,
  Other: Tag,
};

function formatPosted(createdAtIso: string) {
  const createdAt = new Date(createdAtIso);
  if (Number.isNaN(createdAt.getTime())) {
    return "Recently";
  }

  const minutesAgo = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  if (minutesAgo < 60) {
    return `${minutesAgo} min ago`;
  }
  if (minutesAgo < 1440) {
    return `${Math.floor(minutesAgo / 60)} hours ago`;
  }
  return `${Math.floor(minutesAgo / 1440)} days ago`;
}

function formatPrice(price: number) {
  return price === 0 ? "Free" : `$${price}`;
}

async function readFilesAsDataUrls(files: File[]) {
  const toDataUrl =
    (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Invalid file read result."));
      };
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });

  return Promise.all(files.map(toDataUrl));
}

export default function ExchangePage() {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingLoadError, setListingLoadError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | Category>("All");
  const [selectedCondition, setSelectedCondition] = useState<"All" | Condition>("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [interestState, setInterestState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [interestError, setInterestError] = useState("");
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    category: "Textbooks" as Category,
    condition: "Good" as Condition,
    price: "",
    seller: "",
    sellerEmail: "",
    sellerPhone: "",
    imageFiles: [] as File[],
    imagePreviews: [] as string[],
  });
  const [interestForm, setInterestForm] = useState({
    interestedName: "",
    interestedEmail: "",
    interestedPhone: "",
    message: "",
  });
  const [formError, setFormError] = useState("");
  const interestFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setIsLoadingListings(true);
        setListingLoadError("");

        const response = await fetch("/api/exchange/listings", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load listings from the server.");
        }

        const payload = (await response.json()) as { listings?: Listing[] };
        setAllListings(payload.listings ?? []);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load listings from the server.";
        setListingLoadError(message);
      } finally {
        setIsLoadingListings(false);
      }
    };

    void loadListings();
  }, []);

  useEffect(() => {
    if (!showInterestForm) {
      return;
    }

    requestAnimationFrame(() => {
      interestFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [showInterestForm]);

  const visibleListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = allListings.filter((item) => {
      const categoryMatch = selectedCategory === "All" || item.category === selectedCategory;
      const conditionMatch = selectedCondition === "All" || item.condition === selectedCondition;
      const searchMatch =
        normalizedQuery.length === 0 ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.seller.toLowerCase().includes(normalizedQuery);

      return categoryMatch && conditionMatch && searchMatch;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "priceLow") {
        return a.price - b.price;
      }
      return b.price - a.price;
    });

    return sorted;
  }, [allListings, searchQuery, selectedCategory, selectedCondition, sortBy]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    try {
      const previewUrls = await readFilesAsDataUrls(selectedFiles);
      setNewListing((current) => ({
        ...current,
        imageFiles: [...current.imageFiles, ...selectedFiles],
        imagePreviews: [...current.imagePreviews, ...previewUrls],
      }));
    } catch {
      setFormError("Could not process selected images. Please try different files.");
    }

    event.target.value = "";
  };

  const removePreviewImage = (indexToRemove: number) => {
    setNewListing((current) => ({
      ...current,
      imageFiles: current.imageFiles.filter((_, index) => index !== indexToRemove),
      imagePreviews: current.imagePreviews.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleCreateListing = async () => {
    const title = newListing.title.trim();
    const description = newListing.description.trim();
    const seller = newListing.seller.trim();
    const sellerEmail = newListing.sellerEmail.trim();
    const sellerPhone = newListing.sellerPhone.trim();
    const parsedPrice = Number(newListing.price);

    if (!title || !description || !seller || !sellerEmail || !sellerPhone) {
      setFormError("Please complete all required fields, including email and phone.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(sellerEmail)) {
      setFormError("Please provide a valid seller email.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError("Price must be a non-negative number.");
      return;
    }

    if (newListing.imagePreviews.length === 0) {
      setFormError("Please upload at least one image for the listing.");
      return;
    }

    try {
      const response = await fetch("/api/exchange/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          category: newListing.category,
          condition: newListing.condition,
          price: parsedPrice,
          sellerName: seller,
          sellerEmail,
          sellerPhone,
          imageUrls: newListing.imagePreviews,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to save listing.");
      }

      const payload = (await response.json()) as { listing: Listing };
      setAllListings((current) => [payload.listing, ...current]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save listing to the database.";
      setFormError(message);
      return;
    }

    setNewListing({
      title: "",
      description: "",
      category: "Textbooks",
      condition: "Good",
      price: "",
      seller: "",
      sellerEmail: "",
      sellerPhone: "",
      imageFiles: [],
      imagePreviews: [],
    });
    setFormError("");
    setIsFormOpen(false);
  };

  const submitInterest = async () => {
    if (!selectedListing) {
      return;
    }

    const interestedName = interestForm.interestedName.trim();
    const interestedEmail = interestForm.interestedEmail.trim();
    const interestedPhone = interestForm.interestedPhone.trim();
    const message = interestForm.message.trim();

    if (!interestedName || !interestedEmail || !message) {
      setInterestError("Please provide your name, email, and a short message.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(interestedEmail)) {
      setInterestError("Please provide a valid email address.");
      return;
    }

    try {
      setInterestState("sending");
      setInterestError("");

      const response = await fetch("/api/exchange/interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: selectedListing.id,
          listingTitle: selectedListing.title,
          sellerName: selectedListing.seller,
          sellerEmail: selectedListing.sellerEmail,
          interestedName,
          interestedEmail,
          interestedPhone,
          message,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string; hint?: string }
          | null;

        const detailParts = [payload?.error, payload?.details, payload?.hint].filter(
          (part): part is string => Boolean(part)
        );

        throw new Error(
          detailParts.length > 0
            ? detailParts.join(" ")
            : "Unable to send interest email."
        );
      }

      setInterestState("success");
      setInterestForm({
        interestedName: "",
        interestedEmail: "",
        interestedPhone: "",
        message: "",
      });
    } catch (error) {
      const fallbackMessage = "Could not send email right now. Please try again.";
      setInterestError(error instanceof Error ? error.message : fallbackMessage);
      setInterestState("error");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Violet Exchange</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buy, sell, and trade within the NYU community. Textbooks, furniture,
            meal swipes, and more.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={() => {
            setFormError("");
            setIsFormOpen(true);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          List Item
        </button>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_auto_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by item or seller"
            value={searchQuery}
          />
        </label>

        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          onChange={(event) => setSelectedCondition(event.target.value as "All" | Condition)}
          value={selectedCondition}
        >
          {conditionOptions.map((condition) => (
            <option key={condition} value={condition}>
              {condition === "All" ? "All Conditions" : condition}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          onChange={(event) => setSortBy(event.target.value as SortOption)}
          value={sortBy}
        >
          <option value="newest">Newest</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
        </select>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              selectedCategory === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-card-foreground hover:bg-accent"
            }`}
            onClick={() => setSelectedCategory(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Showing {visibleListings.length} of {allListings.length} listings
      </p>

      {listingLoadError ? (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {listingLoadError}
        </div>
      ) : null}

      {isLoadingListings ? (
        <div className="mb-4 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading listings...
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleListings.map((item) => {
          const Icon = categoryIcons[item.category] ?? Tag;
          return (
            <button
              key={item.id}
              className="flex flex-col rounded-lg border border-border bg-card p-5 text-left transition-shadow hover:shadow-md"
              onClick={() => {
                setSelectedListing(item);
                setActiveImageIndex(0);
                setShowInterestForm(false);
                setInterestState("idle");
                setInterestError("");
              }}
              type="button"
            >
              {item.imageUrls.length > 0 ? (
                <img
                  alt={item.title}
                  className="mb-4 h-32 w-full rounded-md object-cover"
                  src={item.imageUrls[0]}
                />
              ) : (
                <div className="mb-4 flex h-32 items-center justify-center rounded-md bg-secondary/50">
                  <Icon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}

              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                  <span
                    className={`text-sm font-semibold ${item.price === 0 ? "text-green-600" : ""}`}
                  >
                    {formatPrice(item.price)}
                  </span>
                </div>

                <h3 className="mb-1 font-medium leading-snug">{item.title}</h3>

                <p className="mb-3 text-xs text-muted-foreground">Condition: {item.condition}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.seller}</span>
                  <span>{formatPosted(item.createdAt)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {visibleListings.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No listings match your filters. Try changing your search or category.
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto my-4 w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Listing</h2>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <input
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                onChange={(event) =>
                  setNewListing((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Item title"
                value={newListing.title}
              />

              <textarea
                className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                onChange={(event) =>
                  setNewListing((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Describe the item and pickup details"
                value={newListing.description}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  onChange={(event) =>
                    setNewListing((current) => ({ ...current, category: event.target.value as Category }))
                  }
                  value={newListing.category}
                >
                  {categories
                    .filter((category) => category !== "All")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>

                <select
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  onChange={(event) =>
                    setNewListing((current) => ({ ...current, condition: event.target.value as Condition }))
                  }
                  value={newListing.condition}
                >
                  {conditionOptions
                    .filter((condition) => condition !== "All")
                    .map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  min="0"
                  onChange={(event) =>
                    setNewListing((current) => ({ ...current, price: event.target.value }))
                  }
                  placeholder="Price (0 for free)"
                  type="number"
                  value={newListing.price}
                />
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(event) =>
                    setNewListing((current) => ({ ...current, seller: event.target.value }))
                  }
                  placeholder="Seller name"
                  value={newListing.seller}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(event) =>
                    setNewListing((current) => ({ ...current, sellerEmail: event.target.value }))
                  }
                  placeholder="Seller email"
                  type="email"
                  value={newListing.sellerEmail}
                />
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(event) =>
                    setNewListing((current) => ({ ...current, sellerPhone: event.target.value }))
                  }
                  placeholder="Seller phone"
                  value={newListing.sellerPhone}
                />
              </div>

              <label className="rounded-lg border border-dashed border-border bg-background px-3 py-3 text-sm">
                <span className="mb-2 block font-medium">Listing photos</span>
                <input accept="image/*" multiple onChange={handleImageSelect} type="file" />
              </label>

              {newListing.imagePreviews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {newListing.imagePreviews.map((preview, index) => (
                    <div className="relative" key={`${preview}-${index}`}>
                      <img
                        alt={`Listing preview ${index + 1}`}
                        className="h-20 w-full rounded-md object-cover"
                        src={preview}
                      />
                      <button
                        className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white"
                        onClick={() => removePreviewImage(index)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  className="rounded-lg border border-border px-4 py-2 text-sm"
                  onClick={() => setIsFormOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  onClick={handleCreateListing}
                  type="button"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedListing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto my-4 w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedListing.title}</h2>
              <button
                aria-label="Close details"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent"
                onClick={() => {
                  setSelectedListing(null);
                  setActiveImageIndex(0);
                  setShowInterestForm(false);
                  setInterestState("idle");
                  setInterestError("");
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedListing.imageUrls.length > 0 ? (
              <div className="mb-4">
                <div className="relative">
                  <img
                    alt={`${selectedListing.title} image ${activeImageIndex + 1}`}
                    className="max-h-[56vh] w-full rounded-lg bg-secondary/30 object-contain"
                    src={selectedListing.imageUrls[activeImageIndex]}
                  />

                  {selectedListing.imageUrls.length > 1 ? (
                    <>
                      <button
                        aria-label="Previous image"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/75"
                        onClick={() =>
                          setActiveImageIndex((current) =>
                            current === 0
                              ? selectedListing.imageUrls.length - 1
                              : current - 1
                          )
                        }
                        type="button"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        aria-label="Next image"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/75"
                        onClick={() =>
                          setActiveImageIndex((current) =>
                            current === selectedListing.imageUrls.length - 1
                              ? 0
                              : current + 1
                          )
                        }
                        type="button"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                </div>

                {selectedListing.imageUrls.length > 1 ? (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {selectedListing.imageUrls.map((imageUrl, index) => (
                      <button
                        aria-label={`View image ${index + 1}`}
                        className={`shrink-0 overflow-hidden rounded-md border ${
                          index === activeImageIndex ? "border-primary" : "border-border"
                        }`}
                        key={`${imageUrl}-${index}`}
                        onClick={() => setActiveImageIndex(index)}
                        type="button"
                      >
                        <img
                          alt={`${selectedListing.title} thumbnail ${index + 1}`}
                          className="h-14 w-20 object-cover"
                          src={imageUrl}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mb-4 flex h-56 items-center justify-center rounded-lg bg-secondary/50">
                {(() => {
                  const Icon = categoryIcons[selectedListing.category] ?? Tag;
                  return <Icon className="h-10 w-10 text-muted-foreground/50" />;
                })()}
              </div>
            )}

            <div className="mb-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>Category: <span className="text-foreground">{selectedListing.category}</span></p>
              <p>Condition: <span className="text-foreground">{selectedListing.condition}</span></p>
              <p>Price: <span className="text-foreground">{formatPrice(selectedListing.price)}</span></p>
              <p>Posted: <span className="text-foreground">{formatPosted(selectedListing.createdAt)}</span></p>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{selectedListing.description}</p>

            <div className="mb-4 rounded-lg border border-border bg-background p-3 text-sm">
              <p className="mb-2 font-medium">Seller Contact</p>
              <p className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {selectedListing.sellerEmail}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {selectedListing.sellerPhone}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                className="rounded-lg border border-border px-4 py-2 text-sm"
                onClick={() => {
                  setSelectedListing(null);
                  setActiveImageIndex(0);
                }}
                type="button"
              >
                Close
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={() => {
                  setShowInterestForm((current) => !current);
                  setInterestState("idle");
                  setInterestError("");
                }}
                type="button"
              >
                <Send className="h-4 w-4" />
                Show Interest
              </button>
            </div>

            {showInterestForm ? (
              <div ref={interestFormRef} className="mt-4 rounded-lg border border-border bg-background p-4">
                <h3 className="mb-3 text-sm font-medium">Send interest to {selectedListing.seller}</h3>

                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                      onChange={(event) =>
                        setInterestForm((current) => ({ ...current, interestedName: event.target.value }))
                      }
                      placeholder="Your name"
                      value={interestForm.interestedName}
                    />
                    <input
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                      onChange={(event) =>
                        setInterestForm((current) => ({ ...current, interestedEmail: event.target.value }))
                      }
                      placeholder="Your email"
                      type="email"
                      value={interestForm.interestedEmail}
                    />
                  </div>

                  <input
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    onChange={(event) =>
                      setInterestForm((current) => ({ ...current, interestedPhone: event.target.value }))
                    }
                    placeholder="Your phone (optional)"
                    value={interestForm.interestedPhone}
                  />

                  <textarea
                    className="min-h-24 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    onChange={(event) =>
                      setInterestForm((current) => ({ ...current, message: event.target.value }))
                    }
                    placeholder="Hi, I'm interested in this listing..."
                    value={interestForm.message}
                  />

                  {interestError ? <p className="text-sm text-red-600">{interestError}</p> : null}
                  {interestState === "success" ? (
                    <p className="text-sm text-green-600">Your interest email has been sent.</p>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={interestState === "sending"}
                      onClick={submitInterest}
                      type="button"
                    >
                      {interestState === "sending" ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
