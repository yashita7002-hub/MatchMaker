/**
 * Shared Domain Types & Interfaces for Project Matchmaker
 */

export type UserStatus = 'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects';

export interface UserSummary {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl?: string;
  trustScore?: number;
}

export interface UserProfile extends UserSummary {
  bio?: string;
  status?: UserStatus;
  skills: string[];
  roles: string[];
  reviewsCount?: number;
  repositories?: Array<{
    name: string;
    description?: string;
    language?: string;
    stars?: number;
    url?: string;
  }>;
}

export type ProjectStatus = 'Recruiting' | 'Active' | 'Completed' | 'Archived';

export interface ProjectSummary {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  status: ProjectStatus;
  ownerId: string | UserSummary;
  members: (string | UserSummary)[];
  maxTeamSize: number;
  requiredSkills?: string[];
  requiredRoles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface ApplicationItem {
  _id: string;
  projectId: string | { _id: string; title: string; ownerId?: string; status?: string };
  userId: string | (UserSummary & { bio?: string; skills?: string[] });
  role: string;
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: string;
}

export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined';

export interface InvitationItem {
  _id: string;
  projectId: string | { _id: string; title: string; ownerId?: UserSummary; status?: string; requiredSkills?: string[] };
  userId: string | UserSummary;
  role: string;
  message?: string;
  status: InvitationStatus;
  createdAt?: string;
}

export interface CandidateRecommendation {
  candidate: UserProfile;
  matchScore: number;
  reasons: string[];
  suggestedRole: string;
  isAiGenerated: boolean;
}

// ── Chat Domain Interfaces ──

export interface ChatUser {
  _id: string;
  name: string;
  githubUsername: string;
  avatarUrl: string;
}

export interface ChatAttachment {
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  publicId?: string;
  resourceType?: string;
}

export interface PendingAttachment {
  uploadId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface ChatMessage {
  _id: string;
  userId: string;
  projectId?: string;
  conversationId?: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  imageUrl?: string;
  attachments?: ChatAttachment[];
  replyTo?: ChatMessage | string;
  reactions?: Array<{ userId: string; emoji: string }>;
  deliveredTo?: string[];
  readBy?: string[];
  editedAt?: string;
  isDeleted?: boolean;
  createdAt: string;
}

export interface ChatConversation {
  _id: string;
  type: 'direct' | 'group';
  projectId?: string;
  title?: string;
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface SavedMessage {
  _id: string;
  messageId: ChatMessage;
}
