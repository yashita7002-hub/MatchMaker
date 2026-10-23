import React, { ReactNode } from 'react';

export type IconName =
  | "arrow"
  | "bell"
  | "bolt"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "code"
  | "filter"
  | "menu"
  | "message"
  | "people"
  | "search"
  | "sparkle"
  | "wallet";

export interface LandingProject {
  _id: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  requiredRoles: string[];
  maxTeamSize: number;
  status: "Recruiting" | "Active" | "Completed" | "Archived";
  members: Array<{
    _id: string;
    githubUsername: string;
    name: string;
    avatarUrl: string;
  }>;
  ownerId: {
    _id: string;
    githubUsername: string;
    name: string;
    avatarUrl: string;
    trustScore: number;
  };
  createdAt: string;
  accent?: string;
  featured?: boolean;
}

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  bolt: <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  code: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  sparkle: (
    <path d="m12 3 1.4 4.1L17 9l-3.6 1.9L12 15l-1.4-4.1L7 9l3.6-1.9L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 13l.7 1.3L21 15l-1.3.7L19 17l-.7-1.3L17 15l1.3-.7L19 13Z" />
  ),
  wallet: <path d="M4 5h14a2 2 0 0 1 2 2v12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13M15 12h7v4h-7a2 2 0 0 1 0-4Z" />,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="eyebrow">
      <span />
      <span>{children}</span>
    </div>
  );
}

export const SAMPLE_PROJECTS: LandingProject[] = [
  {
    _id: "sample-1",
    title: "Carbon Ledger",
    description: "An open toolkit that makes product-level carbon reporting useful for small manufacturers.",
    category: "Hackathon",
    requiredSkills: ["Next.js", "Python", "AI", "TailwindCSS"],
    requiredRoles: ["ML Engineer", "Product Designer"],
    maxTeamSize: 5,
    status: "Recruiting",
    members: [
      { _id: "m1", githubUsername: "ari", name: "Ari", avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4" },
      { _id: "m2", githubUsername: "jules", name: "Jules", avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4" },
    ],
    ownerId: {
      _id: "o1",
      githubUsername: "ari",
      name: "Ari Chen",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      trustScore: 98,
    },
    createdAt: new Date().toISOString(),
    accent: "cyan",
    featured: true,
  },
  {
    _id: "sample-2",
    title: "OpenLab Atlas",
    description: "A shared map of community laboratories, equipment, and accessible research programs.",
    category: "Open Source",
    requiredSkills: ["React", "Mapbox", "Node.js", "TypeScript"],
    requiredRoles: ["Frontend", "Community Lead"],
    maxTeamSize: 6,
    status: "Active",
    members: [
      { _id: "m3", githubUsername: "sam", name: "Sam", avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4" },
      { _id: "m4", githubUsername: "noor", name: "Noor", avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4" },
    ],
    ownerId: {
      _id: "o2",
      githubUsername: "sam",
      name: "Sam K.",
      avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
      trustScore: 95,
    },
    createdAt: new Date().toISOString(),
    accent: "indigo",
    featured: true,
  },
  {
    _id: "sample-3",
    title: "Focusflow",
    description: "A calmer, research-backed workspace for neurodiverse student teams.",
    category: "College Project",
    requiredSkills: ["Flutter", "Firebase", "Dart"],
    requiredRoles: ["Mobile Developer", "UX Researcher"],
    maxTeamSize: 4,
    status: "Recruiting",
    members: [
      { _id: "m5", githubUsername: "mika", name: "Mika", avatarUrl: "https://avatars.githubusercontent.com/u/5?v=4" },
    ],
    ownerId: {
      _id: "o3",
      githubUsername: "mika",
      name: "Mika Tanaka",
      avatarUrl: "https://avatars.githubusercontent.com/u/5?v=4",
      trustScore: 92,
    },
    createdAt: new Date().toISOString(),
    accent: "blue",
  },
  {
    _id: "sample-4",
    title: "Streetlight",
    description: "Making late-night campus walks feel safer through smart community check-ins.",
    category: "College Project",
    requiredSkills: ["React Native", "Supabase", "iOS"],
    requiredRoles: ["Backend Architect", "iOS Engineer"],
    maxTeamSize: 5,
    status: "Active",
    members: [
      { _id: "m6", githubUsername: "alex", name: "Alex", avatarUrl: "https://avatars.githubusercontent.com/u/6?v=4" },
    ],
    ownerId: {
      _id: "o4",
      githubUsername: "alex",
      name: "Alex Rivera",
      avatarUrl: "https://avatars.githubusercontent.com/u/6?v=4",
      trustScore: 96,
    },
    createdAt: new Date().toISOString(),
    accent: "cyan",
  },
  {
    _id: "sample-5",
    title: "Patchwork",
    description: "Turn fragmented learning resources into adaptive, open study paths.",
    category: "Startup",
    requiredSkills: ["Python", "AI", "FastAPI"],
    requiredRoles: ["Data Scientist", "Content Lead"],
    maxTeamSize: 4,
    status: "Recruiting",
    members: [
      { _id: "m7", githubUsername: "sarah", name: "Sarah", avatarUrl: "https://avatars.githubusercontent.com/u/7?v=4" },
    ],
    ownerId: {
      _id: "o5",
      githubUsername: "sarah",
      name: "Sarah Lin",
      avatarUrl: "https://avatars.githubusercontent.com/u/7?v=4",
      trustScore: 99,
    },
    createdAt: new Date().toISOString(),
    accent: "indigo",
  },
];

export const PEOPLE = [
  ["AR", "Ari", "Product"],
  ["JM", "Jules", "Engineering"],
  ["SK", "Sam", "Research"],
  ["NO", "Noor", "Design"],
  ["MK", "Mika", "Data"],
];
