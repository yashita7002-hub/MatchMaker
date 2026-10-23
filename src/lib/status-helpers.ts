/**
 * Unified Status & Formatting Helpers
 * Single source of truth for developer status, project status, category colors, and date formatting.
 */

export const getStatusColor = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case 'looking for team':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case 'available':
      return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    case 'looking for projects':
      return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    case 'busy':
      return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    default:
      return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
  }
};

export const getProjectStatusColor = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case 'recruiting':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    case 'active':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'completed':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'archived':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    case 'pending':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    case 'accepted':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'rejected':
    case 'declined':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

export const getCategoryColor = (category?: string): string => {
  switch (category) {
    case 'Hackathon':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    case 'Startup':
      return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    case 'Open Source':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    case 'Research':
      return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    default:
      return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
  }
};

export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export const memberProgress = (current: number, max: number): number =>
  Math.min(100, Math.round((current / Math.max(1, max)) * 100));
