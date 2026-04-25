import { Star, Clock, MessageCircle, GraduationCap } from "lucide-react";

const mentors = [
  {
    name: "Sarah Chen",
    major: "Computer Science, Senior",
    topics: ["Data Structures", "Interview Prep", "Internships"],
    rating: 4.9,
    sessions: 47,
    available: true,
    bio: "SWE intern at Google last summer. Happy to help with CS-UY courses and tech interview prep.",
  },
  {
    name: "Marcus Johnson",
    major: "Finance, Junior",
    topics: ["Investment Banking", "Case Studies", "Networking"],
    rating: 4.8,
    sessions: 32,
    available: true,
    bio: "Stern transfer, worked at JPMorgan. Can help with finance recruiting and resume reviews.",
  },
  {
    name: "Aisha Patel",
    major: "Data Science, Senior",
    topics: ["Machine Learning", "Python", "Research"],
    rating: 5.0,
    sessions: 28,
    available: false,
    bio: "Published ML research with Prof. Lakshmi. Great at explaining stats and ML concepts.",
  },
  {
    name: "Diego Rivera",
    major: "Electrical Engineering, Junior",
    topics: ["Circuits", "Lab Reports", "Study Tips"],
    rating: 4.7,
    sessions: 19,
    available: true,
    bio: "TA for EE-UY 3054. I've been through the ECE grind and can help you survive it.",
  },
  {
    name: "Emma Williams",
    major: "Pre-Med Biology, Senior",
    topics: ["MCAT Prep", "Research Opportunities", "Course Selection"],
    rating: 4.9,
    sessions: 41,
    available: true,
    bio: "528 MCAT scorer, 4 years of research at Langone. Ask me anything about the pre-med path.",
  },
  {
    name: "Raj Krishnamurthy",
    major: "Computer Engineering, Senior",
    topics: ["Embedded Systems", "C/C++", "Grad School Apps"],
    rating: 4.6,
    sessions: 15,
    available: true,
    bio: "Admitted to CMU and MIT for MS. Can help with grad school apps and ECE coursework.",
  },
];

export default function MentoringPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Peer Mentoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get quick, informal advice from students who've been there. No
          appointment needed -- just a 5-minute chat.
        </p>
      </div>

      {/* Topic filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          "All",
          "Computer Science",
          "Engineering",
          "Finance",
          "Pre-Med",
          "Interview Prep",
          "Grad School",
        ].map((topic) => (
          <button
            key={topic}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              topic === "All"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-card-foreground hover:bg-accent"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Mentors grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mentors.map((mentor) => (
          <div
            key={mentor.name}
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
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium">{mentor.rating}</span>
              </div>
            </div>

            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              {mentor.bio}
            </p>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {mentor.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {mentor.sessions} sessions
              </span>
              <button
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  mentor.available
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                disabled={!mentor.available}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {mentor.available ? "Chat" : "Unavailable"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
