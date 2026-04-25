"use client";

import React, { useState, useEffect } from "react";
import { Dumbbell, BookOpen, Users, Plus, Heart, Mountain, ChefHat, X } from "lucide-react";

const partnerListings = [
  {
    activity: "Gym Partner",
    seeking: "partner",
    description: "Looking for a gym buddy to hit the weights and cardio sessions 3-4 times a week. Preferably mornings or evenings.",
    time: "Weekdays 7-9 AM or 5-7 PM",
    location: "NYU Palladium Fitness Center",
    name: "Alex M.",
    contact: "alex.m@nyu.edu",
    posted: "1 hour ago",
    maxParticipants: 2,
    currentParticipants: 1,
    participants: ["Alex M."],
  },
  {
    activity: "Study Group",
    seeking: "group",
    description: "Forming a study group for CS algorithms course. Looking for 3-4 more people to meet twice a week.",
    time: "Tuesdays & Thursdays 3-5 PM",
    location: "Bobst Library Study Rooms",
    name: "Jordan K.",
    contact: "jordan.k@nyu.edu",
    posted: "3 hours ago",
    maxParticipants: 5,
    currentParticipants: 4,
    participants: ["Jordan K.", "Sarah L.", "Mike Chen", "Priya Patel"],
  },
  {
    activity: "Basketball",
    seeking: "group",
    description: "Looking for players to join casual pickup games at the gym. All skill levels welcome! Need 4-6 more players.",
    time: "Weekends 2-4 PM",
    location: "NYU Coles Sports Center",
    name: "Sam R.",
    contact: "sam.r@nyu.edu",
    posted: "5 hours ago",
    maxParticipants: 8,
    currentParticipants: 6,
    participants: ["Sam R.", "Mike T.", "Lisa P.", "David Kim", "Rachel Wong", "James Liu"],
  },
  {
    activity: "Running Partner",
    seeking: "partner",
    description: "Seeking a running buddy for morning runs around Washington Square Park. 5-6 miles pace.",
    time: "Weekdays 6-7 AM",
    location: "Washington Square Park",
    name: "Priya D.",
    contact: "priya.d@nyu.edu",
    posted: "1 day ago",
    maxParticipants: 2,
    currentParticipants: 1,
    participants: ["Priya D."],
  },
  {
    activity: "Language Exchange",
    seeking: "group",
    description: "Want to practice Spanish conversation. Forming a small group of 4-5 people for weekly meetups.",
    time: "Fridays 4-6 PM",
    location: "Kimmel Center Student Lounge",
    name: "Carlos L.",
    contact: "carlos.l@nyu.edu",
    posted: "2 days ago",
    maxParticipants: 6,
    currentParticipants: 5,
    participants: ["Carlos L.", "Maria G.", "Antonio M.", "Isabella T."],
  },
  {
    activity: "Yoga Sessions",
    seeking: "group",
    description: "Looking for people interested in group yoga sessions. Beginner-friendly, focus on mindfulness. Seeking 5-8 participants.",
    time: "Saturdays 9-10:30 AM",
    location: "Washington Square Park",
    name: "Maya T.",
    contact: "maya.t@nyu.edu",
    posted: "4 hours ago",
    maxParticipants: 10,
    currentParticipants: 7,
    participants: ["Maya T.", "John D.", "Anna K.", "Robert S.", "Lisa Chen", "Michael Brown", "Emma Davis"],
  },
  {
    activity: "Hiking Group",
    seeking: "group",
    description: "Planning weekend hikes in nearby areas. Looking for adventurous people to join our group of 6.",
    time: "Saturdays 8 AM - 2 PM",
    location: "Bear Mountain State Park",
    name: "David W.",
    contact: "david.w@nyu.edu",
    posted: "6 hours ago",
    maxParticipants: 8,
    currentParticipants: 5,
    participants: ["David W.", "Emma R.", "Chris M.", "Sarah Johnson", "Tom Wilson"],
  },
  {
    activity: "Cooking Club",
    seeking: "partner",
    description: "Looking for someone to cook meals with and try new recipes. Great for sharing costs and having fun in the kitchen.",
    time: "Evenings 7-9 PM",
    location: "Shared Kitchen in Residence Hall",
    name: "Emma S.",
    contact: "emma.s@nyu.edu",
    posted: "8 hours ago",
    maxParticipants: 2,
    currentParticipants: 1,
    participants: ["Emma S."],
  },
];

const activityIcons: Record<string, typeof Dumbbell> = {
  "Gym Partner": Dumbbell,
  "Study Partner": BookOpen,
  "Study Group": BookOpen,
  "Basketball": Users,
  "Running Partner": Users,
  "Language Exchange": Users,
  "Yoga Sessions": Heart,
  "Hiking Group": Mountain,
  "Cooking Club": ChefHat,
};

export default function PartnerPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [formData, setFormData] = useState({
    activity: "",
    seeking: "partner",
    description: "",
    time: "",
    location: "",
    name: "",
    contact: "",
    maxParticipants: 1,
  });
  const [mounted, setMounted] = useState(false);
  
  // Load listings from localStorage on component mount
  const [listings, setListings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('partnerListings');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Validate that it's an array and has the expected structure
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn('Failed to load partner listings from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('partnerListings');
      }
    }
    return partnerListings;
  });

  // Load joined listings from localStorage
  const [joinedListings, setJoinedListings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('joinedListings');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Validate that it's an array
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn('Failed to load joined listings from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('joinedListings');
      }
    }
    return [];
  });

  // Save listings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('partnerListings', JSON.stringify(listings));
      } catch (error) {
        console.warn('Failed to save partner listings to localStorage:', error);
      }
    }
  }, [listings]);

  // Save joined listings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('joinedListings', JSON.stringify(joinedListings));
      } catch (error) {
        console.warn('Failed to save joined listings to localStorage:', error);
      }
    }
  }, [joinedListings]);

  // Set mounted to true after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const getFilteredListings = () => {
    if (activeFilter === "All") return listings;

    if (activeFilter === "Partner") {
      return listings.filter(item => item.seeking === "partner");
    }

    if (activeFilter === "Group") {
      return listings.filter(item => item.seeking === "group");
    }

    if (activeFilter === "Gym") {
      return listings.filter(item => item.activity.toLowerCase().includes("gym"));
    }

    if (activeFilter === "Study") {
      return listings.filter(item => item.activity.toLowerCase().includes("study"));
    }

    if (activeFilter === "Sports") {
      return listings.filter(item =>
        item.activity.toLowerCase().includes("basketball") ||
        item.activity.toLowerCase().includes("running") ||
        item.activity.toLowerCase().includes("hiking")
      );
    }

    if (activeFilter === "Clubs") {
      return listings.filter(item =>
        item.activity.toLowerCase().includes("club") ||
        item.activity.toLowerCase().includes("exchange") ||
        item.activity.toLowerCase().includes("sessions") ||
        item.activity === "Other"
      );
    }

    if (activeFilter === "Other") {
      return listings.filter(item =>
        item.activity === "Other" ||
        (!item.activity.toLowerCase().includes("gym") &&
         !item.activity.toLowerCase().includes("study") &&
         !item.activity.toLowerCase().includes("basketball") &&
         !item.activity.toLowerCase().includes("running") &&
         !item.activity.toLowerCase().includes("hiking") &&
         !item.activity.toLowerCase().includes("yoga") &&
         !item.activity.toLowerCase().includes("language") &&
         !item.activity.toLowerCase().includes("cooking") &&
         !item.activity.toLowerCase().includes("club") &&
         !item.activity.toLowerCase().includes("exchange") &&
         !item.activity.toLowerCase().includes("sessions"))
      );
    }

    return listings;
  };

  const filteredListings = getFilteredListings();
  
  // Ensure filteredListings is always an array
  const safeFilteredListings = Array.isArray(filteredListings) ? filteredListings : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maxParticipants = formData.seeking === "partner" ? 2 : Math.max(2, Number(formData.maxParticipants));
    const newListing = {
      ...formData,
      posted: "Just now",
      currentParticipants: 1, // Creator counts as first participant
      maxParticipants,
      participants: [formData.name], // Start with creator
    };
    setListings([newListing, ...listings]);
    setFormData({
      activity: "",
      seeking: "partner",
      description: "",
      time: "",
      location: "",
      name: "",
      contact: "",
      maxParticipants: 1, // Will be set appropriately when seeking changes
    });
    setShowForm(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // When switching to group, set default group size to 2
      if (field === "seeking" && value === "group" && prev.maxParticipants < 2) {
        newData.maxParticipants = 2;
      }
      // When switching to partner, reset maxParticipants
      if (field === "seeking" && value === "partner") {
        newData.maxParticipants = 1; // Will be set to 2 in handleSubmit
      }
      return newData;
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Find Partners & Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect with fellow students for activities around campus. Find gym buddies, study partners, or join group activities.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Post Listing
        </button>
      </div>

      {/* Activity filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "Partner", "Group", "Gym", "Study", "Sports", "Clubs", "Other"].map(
          (filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                filter === activeFilter
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-accent"
              }`}
            >
              {filter}
            </button>
          )
        )}
      </div>

      {/* Listings grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {safeFilteredListings.map((item) => {
          // Validate item data
          if (!item || typeof item !== 'object') return null;
          if (!item.name || !item.activity) return null;
          
          const Icon = activityIcons[item.activity] ?? Users;
          const maxParticipants = Number(item.maxParticipants) || 1;
          const currentParticipants = Number(item.currentParticipants) || 1;
          const slotsLeft = Math.max(0, maxParticipants - currentParticipants);
          const hasJoined = joinedListings.some(joined => joined && joined.name === item.name && joined.posted === item.posted);
          
          return (
            <div
              key={`${item.name}-${item.posted}-${item.activity}`}
              className="flex flex-col rounded-lg border border-border bg-card p-5 transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
              onClick={() => setSelectedListing(item)}
            >
              {/* Icon */}
              <div className="mb-4 flex h-16 items-center justify-center rounded-md bg-secondary/50">
                <Icon className="h-8 w-8 text-muted-foreground/50" />
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.activity}
                  </span>
                  <div className="flex items-center gap-2">
                    {mounted ? (
                      hasJoined ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          You joined
                        </span>
                      ) : slotsLeft === 0 ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Full
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
                        </span>
                      )
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        Loading...
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.seeking === "partner"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}>
                      {item.seeking === "partner" ? "Partner" : "Group"}
                    </span>
                  </div>
                </div>
                <h3 className="mb-2 font-medium leading-snug">{item.name}</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  {item.description}
                </p>
                <div className="mb-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary">🕒 {item.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary">📍 {item.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.contact}</span>
                  <span>{item.posted}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Partner Up Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Partner Up</h2>
              <button
                onClick={() => setSelectedListing(null)}
                className="rounded-full p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/50">
                  {activityIcons[selectedListing.activity] ? 
                    React.createElement(activityIcons[selectedListing.activity], { className: "h-6 w-6 text-muted-foreground/50" }) : 
                    <Users className="h-6 w-6 text-muted-foreground/50" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{selectedListing.activity}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedListing.seeking === "partner"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}>
                      {selectedListing.seeking === "partner" ? "Partner" : "Group"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{selectedListing.description}</p>
                  
                  {/* Participants Section - Always show */}
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">👥</span>
                      <span className="font-semibold text-primary">Current Participants</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {(selectedListing.participants || []).length} joined
                      </span>
                      {Math.max(0, (Number(selectedListing.maxParticipants) || 1) - (Number(selectedListing.currentParticipants) || 1)) === 0 && (
                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full">
                          Full
                        </span>
                      )}
                      {Math.max(0, (Number(selectedListing.maxParticipants) || 1) - (Number(selectedListing.currentParticipants) || 1)) > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded-full">
                          {Math.max(0, (Number(selectedListing.maxParticipants) || 1) - (Number(selectedListing.currentParticipants) || 1))} slot{Math.max(0, (Number(selectedListing.maxParticipants) || 1) - (Number(selectedListing.currentParticipants) || 1)) !== 1 ? 's' : ''} left
                        </span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed text-foreground">
                      {(selectedListing.participants || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(selectedListing.participants || []).map((participant, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedParticipant(participant)}
                              className="text-primary hover:underline font-medium"
                            >
                              {participant}
                            </button>
                          ))}
                        </div>
                      ) : (
                        "No participants yet"
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">👤</span>
                      <span>{selectedListing.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">📧</span>
                      <span>{selectedListing.contact}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                {mounted ? (
                  joinedListings.some(joined => joined.name === selectedListing.name && joined.posted === selectedListing.posted) ? (
                    <div className="flex gap-3">
                      <button
                        className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white"
                        disabled
                      >
                        You Joined ✓
                      </button>
                      <button
                        className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        onClick={() => {
                          const userName = prompt(`Enter your name to leave the group (current participants: ${(selectedListing.participants || []).join(", ")}):`);
                          if (userName && userName.trim()) {
                            // Check if the entered name is actually a participant
                            if (!(selectedListing.participants || []).includes(userName.trim())) {
                              alert(`"${userName.trim()}" is not a participant in this group.`);
                              return;
                            }
                            // Prevent the owner from leaving their own listing
                            if (userName.trim() === selectedListing.name) {
                              alert(`You cannot leave your own listing. As the organizer, you must delete the listing instead.`);
                              return;
                            }
                            // Remove from joined listings
                            setJoinedListings(joinedListings.filter(joined => 
                              !(joined.name === selectedListing.name && joined.posted === selectedListing.posted)
                            ));
                            // Update participant count and remove from participants array
                            const updatedListings = listings.map(listing => 
                              listing.name === selectedListing.name && listing.posted === selectedListing.posted
                                ? { 
                                    ...listing, 
                                    currentParticipants: Math.max(1, (Number(listing.currentParticipants) || 1) - 1),
                                    participants: (listing.participants || []).filter(p => p !== userName.trim())
                                  }
                                : listing
                            );
                            setListings(updatedListings);
                            // Update selectedListing to reflect the changes
                            const updatedListing = updatedListings.find(listing => 
                              listing.name === selectedListing.name && listing.posted === selectedListing.posted
                            );
                            if (updatedListing) {
                              setSelectedListing(updatedListing);
                            }
                            alert(`You've left the group.`);
                          }
                        }}
                      >
                        Leave Group
                      </button>
                    </div>
                  ) : Math.max(0, (Number(selectedListing.maxParticipants) || 1) - (Number(selectedListing.currentParticipants) || 1)) === 0 ? (
                    <button
                      className="flex-1 rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white"
                      disabled
                    >
                      Full
                    </button>
                  ) : (
                    <button
                      className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        const userName = prompt("Enter your name to join:");
                        if (userName && userName.trim()) {
                          // Add to joined listings
                          setJoinedListings([...joinedListings, selectedListing]);
                          // Update participant count and add to participants array
                          const updatedListings = listings.map(listing => 
                            listing.name === selectedListing.name && listing.posted === selectedListing.posted
                              ? { 
                                  ...listing, 
                                  currentParticipants: (Number(listing.currentParticipants) || 1) + 1,
                                  participants: [...(listing.participants || []), userName.trim()]
                                }
                              : listing
                          );
                          setListings(updatedListings);
                          // Update selectedListing to reflect the changes
                          const updatedListing = updatedListings.find(listing => 
                            listing.name === selectedListing.name && listing.posted === selectedListing.posted
                          );
                          if (updatedListing) {
                            setSelectedListing(updatedListing);
                          }
                          alert(`You've joined! Contact ${selectedListing.name} at ${selectedListing.contact} to coordinate.`);
                        }
                      }}
                    >
                      {selectedListing.seeking === "partner" ? "Partner Up" : "Join Group"}
                    </button>
                  )
                ) : (
                  <button
                    className="flex-1 rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white"
                    disabled
                  >
                    Loading...
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participant Info Popup */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Participant Info</h2>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="rounded-full p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <h3 className="font-medium">{selectedParticipant}</h3>
                  <p className="text-sm text-muted-foreground">Participant</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">📧</span>
                  <span>Contact information not available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">🎯</span>
                  <span>Joined this activity</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  This participant is part of the {selectedListing?.activity} activity.
                  You can coordinate with them through the activity organizer: {selectedListing?.name} ({selectedListing?.contact})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Listing Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Post a Partner Listing</h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Activity</label>
                <select
                  value={formData.activity}
                  onChange={(e) => handleInputChange("activity", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select an activity</option>
                  <option value="Gym Partner">Gym Partner</option>
                  <option value="Study Partner">Study Partner</option>
                  <option value="Study Group">Study Group</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Running Partner">Running Partner</option>
                  <option value="Language Exchange">Language Exchange</option>
                  <option value="Yoga Sessions">Yoga Sessions</option>
                  <option value="Hiking Group">Hiking Group</option>
                  <option value="Cooking Club">Cooking Club</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Looking for</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="seeking"
                      value="partner"
                      checked={formData.seeking === "partner"}
                      onChange={(e) => handleInputChange("seeking", e.target.value)}
                    />
                    <span className="text-sm">Partner (1-on-1)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="seeking"
                      value="group"
                      checked={formData.seeking === "group"}
                      onChange={(e) => handleInputChange("seeking", e.target.value)}
                    />
                    <span className="text-sm">Group</span>
                  </label>
                </div>
              </div>

              {formData.seeking === "group" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Group Size (including you)</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="How many people total?"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 2 people for groups</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Describe what you're looking for..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Weekdays 6-8 PM"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g., NYU Palladium Fitness Center"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Post Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}