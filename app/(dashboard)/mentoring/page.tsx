import { Star, Clock, MessageCircle, GraduationCap } from "lucide-react";
import { initialMentors as mentors } from "./mentorsData";

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
