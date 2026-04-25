"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  MessageCircle,
  GraduationCap,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Pencil,
  UserCircle,
  Building2,
  CalendarDays,
  Mail,
  BookOpen,
} from "lucide-react";

interface TimeSlot {
  date: string;   // ISO date string e.g. "2026-04-28"
  startTime: string;
}

interface Mentor {
  dbId?: number;
  name: string;
  email: string;
  major: string;
  program: string;
  topics: string[];
  rating: number;
  sessions: number;
  available: boolean;
  bio: string;
  slots: (TimeSlot & { dbId?: number })[];
}

interface Session {
  id: string;
  role: "booker" | "mentor";
  otherName: string;
  otherEmail: string;
  otherSchool: string;
  otherMajor: string;
  otherTopics: string[];
  otherBio: string;
  date: string;
  startTime: string;
  bookedAt: string;
}

// Get next N days as ISO strings for the date picker default options
function nextNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatSlotDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const TODAY_ISO = new Date().toISOString().split("T")[0];

const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 21; h++) {
  for (const m of [0, 20, 40]) {
    const hour = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "am" : "pm";
    const label = `${hour}:${m === 0 ? "00" : m} ${ampm}`;
    TIME_OPTIONS.push(label);
  }
}

// Synonym map: regex → canonical label
const TOPIC_SYNONYMS: [RegExp, string][] = [
  [/^ml$/i, "Machine Learning"],
  [/^machine\s*learning$/i, "Machine Learning"],
  [/^dsa$/i, "Data Structures"],
  [/^data\s*structures?(\s*&?\s*algorithms?)?$/i, "Data Structures"],
  [/^algo(rithms?)?$/i, "Data Structures"],
  [/^interview\s*prep(aration)?$/i, "Interview Prep"],
  [/^interviews?$/i, "Interview Prep"],
  [/^(c\+\+|cpp)$/i, "C/C++"],
  [/^python\s*(programming)?$/i, "Python"],
  [/^grad(uate)?\s*school(\s*(app(lication)?s?|prep))?$/i, "Grad School Apps"],
  [/^networking$/i, "Networking"],
  [/^investment\s*banking$/i, "Investment Banking"],
  [/^embedded\s*systems?$/i, "Embedded Systems"],
];

function normalizeTopic(t: string): string {
  const trimmed = t.trim().replace(/\s+/g, " ");
  for (const [pattern, canonical] of TOPIC_SYNONYMS) {
    if (pattern.test(trimmed)) return canonical;
  }
  // Default: title-case
  return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
}

const NYU_PROGRAMS = [
  "College of Arts & Science",
  "Graduate School of Arts & Science",
  "Liberal Studies",
  "College of Dentistry",
  "Courant Institute School of Mathematics, Computing, and Data Science",
  "Gallatin School of Individualized Study",
  "NYU Grossman School of Medicine",
  "NYU Grossman Long Island School of Medicine",
  "Institute of Fine Arts",
  "Institute for the Study of the Ancient World",
  "Leonard N. Stern School of Business",
  "Robert F. Wagner Graduate School of Public Service",
  "Rory Meyers College of Nursing",
  "School of Global Public Health",
  "School of Professional Studies",
  "School of Law",
  "Silver School of Social Work",
  "Steinhardt School of Culture, Education, and Human Development",
  "Tandon School of Engineering",
  "Tisch School of the Arts",
  "NYU Abu Dhabi",
  "NYU Shanghai",
  "Center for Urban Science and Progress (CUSP)",
  "Center for Data Science",
  "Other",
];

const SEED_MENTORS: Mentor[] = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@nyu.edu",
    major: "Computer Science, Senior",
    program: "Tandon School of Engineering",
    topics: ["Data Structures", "Interview Prep", "Internships"],
    rating: 4.9,
    sessions: 47,
    available: true,
    bio: "SWE intern at Google last summer. Happy to help with CS-UY courses and tech interview prep.",
    slots: [{ date: "2026-04-28", startTime: "10:00 am" }, { date: "2026-04-30", startTime: "2:00 pm" }],
  },
  {
    name: "Marcus Johnson",
    email: "marcus.j@nyu.edu",
    major: "Finance, Junior",
    program: "Stern School of Business",
    topics: ["Investment Banking", "Case Studies", "Networking"],
    rating: 4.8,
    sessions: 32,
    available: true,
    bio: "Stern transfer, worked at JPMorgan. Can help with finance recruiting and resume reviews.",
    slots: [{ date: "2026-04-29", startTime: "11:00 am" }],
  },
  {
    name: "Aisha Patel",
    email: "aisha.p@nyu.edu",
    major: "Data Science, Senior",
    program: "Tandon School of Engineering",
    topics: ["Machine Learning", "Python", "Research"],
    rating: 5.0,
    sessions: 28,
    available: false,
    bio: "Published ML research with Prof. Lakshmi. Great at explaining stats and ML concepts.",
    slots: [],
  },
  {
    name: "Diego Rivera",
    email: "diego.r@nyu.edu",
    major: "Electrical Engineering, Junior",
    program: "Tandon School of Engineering",
    topics: ["Circuits", "Lab Reports", "Study Tips"],
    rating: 4.7,
    sessions: 19,
    available: true,
    bio: "TA for EE-UY 3054. I've been through the ECE grind and can help you survive it.",
    slots: [{ date: "2026-05-01", startTime: "3:00 pm" }],
  },
  {
    name: "Emma Williams",
    email: "emma.w@nyu.edu",
    major: "Pre-Med Biology, Senior",
    program: "College of Arts & Science",
    topics: ["MCAT Prep", "Research Opportunities", "Course Selection"],
    rating: 4.9,
    sessions: 41,
    available: true,
    bio: "528 MCAT scorer, 4 years of research at Langone. Ask me anything about the pre-med path.",
    slots: [{ date: "2026-05-02", startTime: "1:00 pm" }],
  },
];

// ─── Add / Edit mentor modal ──────────────────────────────────────────────────

interface MentorModalProps {
  onClose: () => void;
  onSave: (m: Mentor) => void;
  initial?: Mentor;
}

function MentorModal({ onClose, onSave, initial }: MentorModalProps) {
  const editing = !!initial;

  // Parse initial major string back into parts e.g. "Computer Science, Junior"
  const initialMajorParts = initial?.major?.split(",").map((s) => s.trim()) ?? [];
  const initialMajorName = initialMajorParts[0] ?? "";
  const initialYear = initialMajorParts[1] ?? "";

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [majorName, setMajorName] = useState(initialMajorName);
  const [degreeLevel, setDegreeLevel] = useState<string>(() => {
    const y = initialYear.toLowerCase();
    if (["masters", "ms", "mba", "ma"].some((x) => y.includes(x))) return "Masters";
    if (y.includes("phd") || y.includes("doctoral")) return "PhD";
    return "Undergraduate";
  });
  const [year, setYear] = useState(initialYear || "");
  const [program, setProgram] = useState(initial?.program ?? NYU_PROGRAMS[0]);
  const [programOther, setProgramOther] = useState(
    initial?.program && !NYU_PROGRAMS.includes(initial.program) ? initial.program : ""
  );
  const [topics, setTopics] = useState<string[]>(initial?.topics ?? []);
  const [topicInput, setTopicInput] = useState("");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [slots, setSlots] = useState<TimeSlot[]>(
    initial?.slots.length ? initial.slots : [{ date: TODAY_ISO, startTime: TIME_OPTIONS[0] }]
  );

  const UNDERGRAD_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"];
  const GRAD_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year+"];
  const PHD_YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5+"];
  const yearOptions =
    degreeLevel === "PhD" ? PHD_YEARS : degreeLevel === "Masters" ? GRAD_YEARS : UNDERGRAD_YEARS;

  function addTopic(val: string) {
    const normalized = normalizeTopic(val.replace(/,+$/, ""));
    if (normalized && !topics.includes(normalized)) setTopics((t) => [...t, normalized]);
    setTopicInput("");
  }
  function removeTopic(t: string) {
    setTopics((prev) => prev.filter((x) => x !== t));
  }
  function handleTopicKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTopic(topicInput);
    } else if (e.key === "Backspace" && topicInput === "" && topics.length > 0) {
      setTopics((t) => t.slice(0, -1));
    }
  }

  function addSlot() {
    setSlots((s) => [...s, { date: TODAY_ISO, startTime: TIME_OPTIONS[0] }]);
  }
  function removeSlot(i: number) {
    setSlots((s) => s.filter((_, idx) => idx !== i));
  }
  function updateSlot(i: number, field: keyof TimeSlot, value: string) {
    setSlots((s) => s.map((sl, idx) => (idx === i ? { ...sl, [field]: value } : sl)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedProgram = program === "Other" ? programOther.trim() || "Other" : program;
    const composedMajor = `${majorName.trim()}${year ? `, ${year}` : ""}`;
    if (!name.trim() || !majorName.trim() || topics.length === 0) return;
    onSave({
      name: name.trim(),
      email: email.trim(),
      major: composedMajor,
      program: resolvedProgram,
      topics,
      rating: initial?.rating ?? 5.0,
      sessions: initial?.sessions ?? 0,
      available: slots.length > 0,
      bio: bio.trim(),
      slots,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit your listing" : "Offer peer mentoring"}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium">Your name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Kim"
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium">Your NYU email *</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="netid@nyu.edu"
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Program */}
          <div>
            <label className="mb-1 block text-sm font-medium">School *</label>
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {NYU_PROGRAMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {program === "Other" && (
              <input
                required
                value={programOther}
                onChange={(e) => setProgramOther(e.target.value)}
                placeholder="Enter your school or program"
                className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            )}
          </div>

          {/* Degree level */}
          <div>
            <label className="mb-1 block text-sm font-medium">Degree level *</label>
            <div className="flex gap-2">
              {["Undergraduate", "Masters", "PhD"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => { setDegreeLevel(level); setYear(""); }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    degreeLevel === level
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Major + year side by side */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Major *</label>
              <input
                required
                value={majorName}
                onChange={(e) => setMajorName(e.target.value)}
                placeholder={degreeLevel === "Undergraduate" ? "e.g. Computer Science" : "e.g. Computer Engineering"}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-sm font-medium">Year *</label>
              <select
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topics tag input */}
          <div>
            <label className="mb-1 block text-sm font-medium">What can you help others with? *</label>
            <div
              className="flex min-h-[42px] flex-wrap gap-1.5 rounded-lg border border-input bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring cursor-text"
              onClick={() => document.getElementById("topic-input")?.focus()}
            >
              {topics.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {t}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeTopic(t); }}
                    className="hover:text-primary/60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="topic-input"
                value={topicInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.endsWith(",")) { addTopic(val); } else { setTopicInput(val); }
                }}
                onKeyDown={handleTopicKeyDown}
                onBlur={() => { if (topicInput.trim()) addTopic(topicInput); }}
                placeholder={topics.length === 0 ? "Type a keyword and press Enter…" : ""}
                className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Press Enter or comma to add each keyword</p>
          </div>

          {/* Time slots */}
          <div>
            <label className="mb-2 block text-sm font-medium">Available time slots (20 min each)</label>
            <div className="space-y-2">
              {slots.map((sl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={sl.date}
                    min={TODAY_ISO}
                    onChange={(e) => updateSlot(i, "date", e.target.value)}
                    className="rounded-lg border border-input bg-card px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <select
                    value={sl.startTime}
                    onChange={(e) => updateSlot(i, "startTime", e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-card px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="shrink-0 text-xs text-muted-foreground">· 20 min</span>
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="rounded-md p-1 hover:bg-accent text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSlot}
              className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add another slot
            </button>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Background{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. TA for CS-UY 1134, interned at Amazon last summer…"
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {editing ? "Save changes" : "Add me to the list"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Book modal ───────────────────────────────────────────────────────────────

function BookModal({ mentor, onClose, onBooked }: {
  mentor: Mentor;
  onClose: () => void;
  onBooked: (bookerName: string, bookerEmail: string, slot: TimeSlot) => void;
}) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(mentor.slots[0] ?? null);
  const [bookerName, setBookerName] = useState("");
  const [bookerEmail, setBookerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !bookerName.trim() || !bookerEmail.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorName: mentor.name,
          mentorEmail: mentor.email,
          bookerName: bookerName.trim(),
          bookerEmail: bookerEmail.trim(),
          day: formatSlotDate(selectedSlot.date),
          startTime: selectedSlot.startTime,
          slotId: (selectedSlot as TimeSlot & { dbId?: number }).dbId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to book");
      onBooked(bookerName.trim(), bookerEmail.trim(), selectedSlot);
      setBooked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Book a session</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {booked ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">You're booked!</h3>
              <p className="text-sm text-muted-foreground">
                Confirmation emails sent to you and {mentor.name}. Check your inbox for details.
              </p>
              <button
                onClick={onClose}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Booking a 20-min session with{" "}
                  <span className="font-medium text-foreground">{mentor.name}</span>
                  {mentor.program && (
                    <span className="text-muted-foreground"> · {mentor.program}</span>
                )}
                </p>

                <label className="mb-2 block text-sm font-medium">Choose a time slot</label>
                <div className="space-y-2">
                  {mentor.slots.map((sl, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        selectedSlot === sl
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        className="accent-primary"
                        checked={selectedSlot === sl}
                        onChange={() => setSelectedSlot(sl)}
                      />
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatSlotDate(sl.date)} · {sl.startTime} — 20 min</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Your name *</label>
                <input
                  required
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Your NYU email *</label>
                <input
                  required
                  type="email"
                  value={bookerEmail}
                  onChange={(e) => setBookerEmail(e.target.value)}
                  placeholder="netid@nyu.edu"
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedSlot}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {loading ? "Booking…" : "Confirm booking"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── My Sessions panel ───────────────────────────────────────────────────────

function MySessionsPanel({ sessions, onClose }: { sessions: Session[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex w-full max-w-md flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">My Sessions</h2>
            <p className="text-xs text-muted-foreground">{sessions.filter((s) => s.role === "mentor").length} upcoming</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.filter((s) => s.role === "mentor").length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Book a session or wait for someone to book you
              </p>
            </div>
          ) : (
            sessions.filter((s) => s.role === "mentor").map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-card p-4 space-y-3"
              >
                {/* Role badge + date */}
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s.role === "booker"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  }`}>
                    {s.role === "booker" ? "You booked" : "Booked you"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatSlotDate(s.date)} · {s.startTime}
                  </span>
                </div>

                {/* Person info */}
                <div>
                  <p className="font-medium text-sm">{s.otherName}</p>
                  {s.otherMajor && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <GraduationCap className="h-3 w-3" />
                      {s.otherMajor}
                    </p>
                  )}
                  {s.otherSchool && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Building2 className="h-3 w-3" />
                      {s.otherSchool}
                    </p>
                  )}
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Mail className="h-3 w-3" />
                    <a href={`mailto:${s.otherEmail}`} className="hover:underline text-primary">
                      {s.otherEmail}
                    </a>
                  </p>
                </div>

                {/* Topics */}
                {s.otherTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.otherTopics.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {s.otherBio && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-2">
                    {s.otherBio}
                  </p>
                )}

                <p className="text-xs text-muted-foreground/50">
                  Booked {new Date(s.bookedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MentoringPage() {
  const [mentors, setMentors] = useState<Mentor[]>(SEED_MENTORS);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [activeSchool, setActiveSchool] = useState("All");
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(true);

  // Load mentors from DB on mount, fall back to seed data
  useEffect(() => {
    fetch("/api/mentors")
      .then((r) => r.json())
      .then((data: Array<{
        id: number; name: string; email: string; major: string;
        program: string; bio: string; topics: string[]; rating: number;
        sessions: number; available: boolean;
        slots: Array<{ id: number; date: string; startTime: string; booked: boolean }>;
      }>) => {
        if (Array.isArray(data) && data.length > 0) {
          setMentors(data.map((m) => ({
            dbId: m.id,
            name: m.name,
            email: m.email,
            major: m.major,
            program: m.program,
            bio: m.bio,
            topics: m.topics,
            rating: m.rating,
            sessions: m.sessions,
            available: m.available,
            slots: m.slots.filter((s) => !s.booked).map((s) => ({ dbId: s.id, date: s.date, startTime: s.startTime })),
          })));
        }
      })
      .catch(() => {/* keep seed data on error */})
      .finally(() => setLoadingMentors(false));
  }, []);

  const myProfile = mentors.find((m) => m.email === myEmail) ?? null;

  // Topic filters: normalize then deduplicate, sorted by frequency
  const topicFilters = ["All", ...Array.from(
    mentors.flatMap((m) => m.topics.map(normalizeTopic))
      .reduce((map, t) => map.set(t, (map.get(t) ?? 0) + 1), new Map<string, number>())
      .entries()
  ).sort((a, b) => b[1] - a[1]).map(([t]) => t)];

  // School filters sorted by frequency
  const schoolFilters = ["All", ...Array.from(
    mentors.map((m) => m.program).filter(Boolean)
      .reduce((map, s) => map.set(s, (map.get(s) ?? 0) + 1), new Map<string, number>())
      .entries()
  ).sort((a, b) => b[1] - a[1]).map(([s]) => s)];

  const filtered = mentors.filter((m) => {
    const topicMatch = activeFilter === "All" || m.topics.map(normalizeTopic).includes(activeFilter);
    const schoolMatch = activeSchool === "All" || m.program === activeSchool;
    return topicMatch && schoolMatch;
  });

  async function handleSaveEdit(updated: Mentor) {
    if (updated.dbId) {
      try {
        const res = await fetch(`/api/mentors/${updated.dbId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updated.name, major: updated.major, program: updated.program,
            bio: updated.bio, topics: updated.topics,
            slots: updated.slots.map((s) => ({ date: s.date, startTime: s.startTime })),
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMentors((prev) => prev.map((m) => m.email === updated.email ? {
            ...updated,
            slots: (data.slots ?? []).map((s: { id: number; date: string; startTime: string }) => ({ dbId: s.id, date: s.date, startTime: s.startTime })),
          } : m));
          setEditingMentor(null);
          return;
        }
      } catch { /* fall through to local update */ }
    }
    setMentors((prev) => prev.map((m) => m.email === updated.email ? updated : m));
    setEditingMentor(null);
  }

  function handleBooked(
    mentor: Mentor,
    bookerName: string,
    bookerEmail: string,
    slot: TimeSlot
  ) {
    // increment session count on the mentor card
    setMentors((prev) =>
      prev.map((m) => m.email === mentor.email ? { ...m, sessions: m.sessions + 1 } : m)
    );
    // record session for the booker
    const session: Session = {
      id: crypto.randomUUID(),
      role: "booker",
      otherName: mentor.name,
      otherEmail: mentor.email,
      otherSchool: mentor.program,
      otherMajor: mentor.major,
      otherTopics: mentor.topics,
      otherBio: mentor.bio,
      date: slot.date,
      startTime: slot.startTime,
      bookedAt: new Date().toISOString(),
    };
    setMySessions((prev) => [session, ...prev]);
    // if the current user IS the mentor, also record from mentor side
    if (myEmail === mentor.email) {
      const inbound: Session = {
        id: crypto.randomUUID(),
        role: "mentor",
        otherName: bookerName,
        otherEmail: bookerEmail,
        otherSchool: "",
        otherMajor: "",
        otherTopics: [],
        otherBio: "",
        date: slot.date,
        startTime: slot.startTime,
        bookedAt: new Date().toISOString(),
      };
      setMySessions((prev) => [inbound, ...prev]);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Peer Mentoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Get quick, informal advice from students who've been there. Sessions are 20 minutes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessions(true)}
            className="relative flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <BookOpen className="h-4 w-4" />
            My Sessions
            {mySessions.filter((s) => s.role === "mentor").length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {mySessions.filter((s) => s.role === "mentor").length}
              </span>
            )}
          </button>
          {myProfile ? (
            <button
              onClick={() => setEditingMentor(myProfile)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <UserCircle className="h-4 w-4" />
              My Profile
            </button>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Offer mentoring
            </button>
          )}
        </div>
      </div>

      {/* Topic filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        {topicFilters.map((topic) => (
          <button
            key={topic}
            onClick={() => setActiveFilter(topic)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              topic === activeFilter
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-card-foreground hover:bg-accent"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* School filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground pr-1">
          <Building2 className="h-3.5 w-3.5" /> School:
        </span>
        {schoolFilters.map((school) => (
          <button
            key={school}
            onClick={() => setActiveSchool(school)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              school === activeSchool
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-card-foreground hover:bg-accent"
            }`}
          >
            {school}
          </button>
        ))}
      </div>

      {/* Mentors grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mentor) => (
          <div
            key={mentor.email}
            className="flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{mentor.name}</h3>
                  {mentor.available ? (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GraduationCap className="h-3 w-3" />
                  {mentor.major}
                </p>
                {mentor.program && (
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{mentor.program}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {myEmail === mentor.email && (
                  <button
                    onClick={() => setEditingMentor(mentor)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Edit your listing"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {mentor.bio && (
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                {mentor.bio}
              </p>
            )}

            <div className="mb-3 flex flex-wrap gap-1.5">
              {mentor.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>

            {mentor.slots.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {mentor.slots.slice(0, 3).map((sl, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    <Clock className="h-3 w-3" />
                    {formatSlotDate(sl.date)} · {sl.startTime}
                  </span>
                ))}
                {mentor.slots.length > 3 && (
                  <button
                    type="button"
                    onClick={() => mentor.available && setBookingMentor(mentor)}
                    className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    +{mentor.slots.length - 3} more
                  </button>
                )}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                {mentor.sessions} sessions
              </span>
              <button
                onClick={() => mentor.available && setBookingMentor(mentor)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  mentor.available
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                disabled={!mentor.available}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {mentor.available ? "Book" : "Unavailable"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <MentorModal
          onClose={() => setShowAddModal(false)}
          onSave={async (m) => {
            // Try to persist to DB
            try {
              const res = await fetch("/api/mentors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: m.name, email: m.email, major: m.major,
                  program: m.program, bio: m.bio, topics: m.topics,
                  slots: m.slots.map((s) => ({ date: s.date, startTime: s.startTime })),
                }),
              });
              const data = await res.json();
              if (res.ok) {
                const saved: Mentor = {
                  ...m,
                  dbId: data.id,
                  slots: (data.slots ?? []).map((s: { id: number; date: string; startTime: string }) => ({ dbId: s.id, date: s.date, startTime: s.startTime })),
                };
                setMentors((prev) => [saved, ...prev]);
                setMyEmail(saved.email);
                setShowAddModal(false);
                setActiveFilter("All");
                setActiveSchool("All");
                return;
              }
            } catch { /* fall through */ }
            // Local-only fallback if no DB
            setMentors((prev) => [m, ...prev]);
            setMyEmail(m.email);
            setShowAddModal(false);
            setActiveFilter("All");
            setActiveSchool("All");
          }}
        />
      )}

      {editingMentor && (
        <MentorModal
          initial={editingMentor}
          onClose={() => setEditingMentor(null)}
          onSave={handleSaveEdit}
        />
      )}

      {bookingMentor && (
        <BookModal
          mentor={bookingMentor}
          onClose={() => setBookingMentor(null)}
          onBooked={(bookerName, bookerEmail, slot) => {
            handleBooked(bookingMentor, bookerName, bookerEmail, slot);
            setBookingMentor(null);
          }}
        />
      )}

      {showSessions && (
        <MySessionsPanel
          sessions={mySessions}
          onClose={() => setShowSessions(false)}
        />
      )}
    </div>
  );
}
