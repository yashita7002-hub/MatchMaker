export interface Repository {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks?: number;
  url: string;
  isPrivate?: boolean;
}

export interface ProfileData {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  bio: string;
  location?: string;
  website?: string;
  status: 'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects';
  skills: string[];
  roles: string[];
  trustScore: number;
  reviewsCount: number;
  ratingsSum: { communication: number; technicalSkills: number; reliability: number; teamwork: number };
  repositories: Repository[];
  createdAt: string;
}

export interface ProjectItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  requiredSkills: string[];
  requiredRoles: string[];
  maxTeamSize: number;
  ownerId: { _id: string; githubUsername: string; name: string; avatarUrl?: string };
  members: { _id: string; githubUsername: string; name: string; avatarUrl?: string }[];
}

export interface ReviewItem {
  _id: string;
  communication: number;
  technicalSkills: number;
  reliability: number;
  teamwork: number;
  comment: string;
  createdAt: string;
  reviewerId: { githubUsername: string; name: string; avatarUrl: string };
  projectId: { title: string };
}

export const getLangColor = (lang: string) => {
  const map: Record<string, string> = {
    TypeScript: '#38bdf8', JavaScript: '#facc15', Python: '#60a5fa',
    Rust: '#f97316', Go: '#22d3ee', Java: '#fb923c', 'C++': '#f43f5e',
    Ruby: '#ef4444', PHP: '#818cf8', Swift: '#fb923c', CSS: '#c084fc',
    HTML: '#f97316', Shell: '#4ade80', Kotlin: '#a855f7',
  };
  return map[lang] || '#a855f7';
};

export const getStatusDot = (status: string) => {
  if (status === 'Available') return 'bg-emerald-400';
  if (status === 'Busy') return 'bg-rose-400';
  if (status.includes('Team')) return 'bg-cyan-400';
  return 'bg-purple-400';
};

export const avgRating = (review: ReviewItem) =>
  (review.communication + review.technicalSkills + review.reliability + review.teamwork) / 4;
