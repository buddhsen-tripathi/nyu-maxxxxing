export interface Mentor {
  name: string;
  major: string;
  topics: string[];
  rating: number;
  sessions: number;
  available: boolean;
  bio: string;
}

export const initialMentors: Mentor[] = [
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
