// ─── Shared workspace types & small utilities ─────────────────────────────────

export interface WorkspaceUser {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  trustScore: number;
}

export interface WorkspaceProject {
  _id: string;
  title: string;
  description: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  ownerId: WorkspaceUser;
  members: WorkspaceUser[];
  maxTeamSize: number;
  requiredSkills?: string[];
  requiredRoles?: string[];
}

export interface Message {
  _id: string;
  userId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  attachments?: Array<{
    fileName: string;
    mimeType: string;
    size: number;
    url?: string;
  }>;
  replyTo?: Message | string;
  reactions?: Array<{ userId: string; emoji: string }>;
  deliveredTo?: string[];
  readBy?: string[];
  editedAt?: string;
  isDeleted?: boolean;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assignedUserId?: string;
  assignedUserName?: string;
  dueDate?: string;
}

export interface Discussion {
  _id: string;
  title: string;
  category: string;
  creatorName: string;
  createdAt: string;
  replies: Array<{
    _id: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: string;
  }>;
}

export interface ExpenseParticipant {
  userId: {
    _id: string;
    name: string;
    githubUsername?: string;
    avatarUrl?: string;
  } | null;
  shareAmount: number;
  status: 'Pending' | 'Awaiting Verification' | 'Paid' | 'Rejected';
  claimedAt?: string;
  verifiedBy?: { _id: string; name: string } | null;
  verifiedAt?: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  loggedBy: string;
  loggedById?: string;
  createdAt: string;
  participants: ExpenseParticipant[];
}

export interface VaultLink {
  _id: string;
  name: string;
  url: string;
  description: string;
  type: string;
  icon?: string;
}

export type ActiveTab = 'chat' | 'kanban' | 'discussions' | 'vault' | 'expenses' | 'reviews' | 'analytics';

export const paymentStatusClass: Record<ExpenseParticipant['status'], string> = {
  Pending: 'bg-slate-500/10 border-slate-500/25 text-slate-300',
  'Awaiting Verification': 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  Paid: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  Rejected: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
};

export function getVaultLinkIcon(type: string): string {
  if (type === 'Code') return 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22';
  if (type === 'Design') return 'M5 5.5A3.5 3.5 0 018.5 2H12v7H8.5A3.5 3.5 0 015 5.5zM12 2h3.5a3.5 3.5 0 110 7H12V2zM5 12.5A3.5 3.5 0 018.5 9H12v7H8.5A3.5 3.5 0 015 12.5zM12 9h3.5a3.5 3.5 0 110 7H12V9zM8.5 16A3.5 3.5 0 0112 19.5V16H8.5z';
  if (type === 'Docs') return 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8';
  if (type === 'Infra') return 'M2 12l10-7 10 7-10 7-10-7z M2 17l10 7 10-7 M2 7l10 7 10-7';
  return 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1';
}

export function getEqualExpenseShares(amount: number, participantIds: string[]): Record<string, number> {
  const totalCents = Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
  if (participantIds.length === 0) return {} as Record<string, number>;
  const baseCents = Math.floor(totalCents / participantIds.length);
  let remainingCents = totalCents;
  return participantIds.reduce<Record<string, number>>((shares, participantId, index) => {
    const shareCents = index === participantIds.length - 1 ? remainingCents : baseCents;
    remainingCents -= shareCents;
    shares[participantId] = shareCents / 100;
    return shares;
  }, {});
}
