export interface DashboardUser {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  trustScore: number;
}

export interface DashboardProject {
  _id: string;
  title: string;
  description: string;
  category: string;
  ownerId: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  requiredSkills: string[];
  requiredRoles: string[];
  members: DashboardUser[];
  maxTeamSize: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardApplication {
  _id: string;
  projectId: { _id: string; title: string; ownerId: string; status: string };
  userId: { _id: string; githubUsername: string; name: string; avatarUrl: string; trustScore: number; bio: string; skills: string[] };
  role: string;
  coverLetter: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}

export interface DashboardInvitation {
  _id: string;
  projectId: { _id: string; title: string; ownerId: DashboardUser; status: string; requiredSkills?: string[] };
  userId: DashboardUser;
  role: string;
  message?: string;
  status: 'Pending' | 'Accepted' | 'Declined';
}

export interface DashboardData {
  ownedProjects: DashboardProject[];
  incomingApplications: DashboardApplication[];
  outgoingInvitations: DashboardInvitation[];
  myApplications: any[];
  myInvitations: any[];
  activeTeams: any[];
}

export const memberProgress = (current: number, max: number) =>
  Math.min(100, Math.round((current / max) * 100));
