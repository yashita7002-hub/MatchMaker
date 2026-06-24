"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import ContributionGraph from '@/components/ContributionGraph';

/* ─── Types ─────────────────────────────────────────────────── */
interface Repository {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks?: number;
  url: string;
  isPrivate?: boolean;
}

interface ProfileData {
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

interface ProjectItem {
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

interface ReviewItem {
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

/* ─── Helpers ───────────────────────────────────────────────── */
const getLangColor = (lang: string) => {
  const map: Record<string, string> = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
    Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
    Ruby: '#701516', PHP: '#4F5D95', Swift: '#ffac45', CSS: '#563d7c',
    HTML: '#e34c26', Shell: '#89e051', Kotlin: '#A97BFF',
  };
  return map[lang] || '#8b5cf6';
};

const getStatusDot = (status: string) => {
  if (status === 'Available') return '#2ea043';
  if (status === 'Busy') return '#f85149';
  if (status.includes('Team') || status.includes('Project')) return '#58a6ff';
  return '#8b949e';
};

const getStatusColor = (status: string) => {
  if (status === 'Available') return 'text-[#2ea043]';
  if (status === 'Busy') return 'text-[#f85149]';
  return 'text-[#58a6ff]';
};

const avgRating = (review: ReviewItem) =>
  (review.communication + review.technicalSkills + review.reliability + review.teamwork) / 4;

const StarRating = ({ score }: { score: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= Math.round(score) ? '#d29922' : 'none'} stroke={i <= Math.round(score) ? '#d29922' : '#8b949e'} strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
);

const TrustBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-xs text-gray-400">
      <span>{label}</span>
      <span className="font-mono text-white">{value.toFixed(1)}</span>
    </div>
    <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-[#d29922] to-[#f0883e] rounded-full transition-all duration-700" style={{ width: `${(value / 5) * 100}%` }} />
    </div>
  </div>
);

/* ─── Main Component ────────────────────────────────────────── */
export default function Profile() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, refreshUser } = useApp();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'reviews'>('overview');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState<ProfileData['status']>('Available');
  const [editSkillsStr, setEditSkillsStr] = useState('');
  const [editRolesStr, setEditRolesStr] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${params.username}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setProjects(data.projects || []);
        setReviews(data.reviews || []);
        setEditName(data.user.name);
        setEditBio(data.user.bio || '');
        setEditStatus(data.user.status);
        setEditSkillsStr(data.user.skills.join(', '));
        setEditRolesStr(data.user.roles.join(', '));
      } else {
        setError('User profile not found.');
      }
    } catch {
      setError('Network error. Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (params.username) fetchProfile(); }, [params.username]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const skills = editSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const roles = editRolesStr.split(',').map(r => r.trim()).filter(Boolean);
      const res = await fetch('/api/users/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, bio: editBio, status: editStatus, skills, roles }),
      });
      if (res.ok) { setIsEditing(false); fetchProfile(); refreshUser(); }
    } catch { /* noop */ } finally { setUpdating(false); }
  };

  const isOwnProfile = currentUser && currentUser.githubUsername === params.username;
  const pinnedRepos = profile?.repositories.slice(0, 6) ?? [];
  const avgTrust = profile ? (profile.trustScore / Math.max(1, profile.reviewsCount)) || profile.trustScore : 0;

  /* ─── Loading ─────────────────────────────────────────────── */
  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-32">
      <svg className="animate-spin h-10 w-10 text-[#58a6ff]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  if (error || !profile) return (
    <div className="flex-1 flex items-center justify-center py-20 px-6">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-md p-10 text-center flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-[#ff7b72]">Profile Not Found</h2>
        <p className="text-gray-400">{error || 'User not found.'}</p>
        <button onClick={() => router.push('/')} className="btn-primary">Back to Discover</button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* ─── LEFT SIDEBAR ───────────────────────────────────── */}
        <aside className="w-full md:w-[260px] flex-shrink-0 flex flex-col gap-5">
          {/* Avatar */}
          <div className="relative">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full max-w-[260px] rounded-full border-4 border-[#30363d] shadow-[0_0_30px_rgba(88,166,255,0.08)] aspect-square object-cover" />
            ) : (
              <div className="w-full max-w-[260px] aspect-square rounded-full bg-[#8b5cf6] flex items-center justify-center text-5xl font-bold text-white border-4 border-[#30363d]">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Handle */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-white leading-tight">{profile.name}</h1>
            <p className="text-lg text-gray-400 font-normal">{profile.githubUsername}</p>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusDot(profile.status) }} />
            <span className={`text-sm font-medium ${getStatusColor(profile.status)}`}>{profile.status}</span>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-gray-300 leading-relaxed">{profile.bio}</p>
          )}

          {/* View GitHub */}
          <a
            href={`https://github.com/${profile.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-1.5 px-4 bg-[#21262d] border border-[#30363d] rounded-md text-sm text-gray-300 hover:border-[#8b949e] hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View GitHub
          </a>

          {/* Edit Profile (own profile) */}
          {isOwnProfile && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="w-full py-1.5 px-4 bg-[#21262d] border border-[#30363d] rounded-md text-sm text-gray-300 hover:border-[#8b949e] hover:text-white transition-colors">
              Edit Profile
            </button>
          )}

          {/* Meta info */}
          <div className="flex flex-col gap-2 text-sm text-gray-400">
            {profile.location && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span>{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">{profile.githubUsername}.dev</a>
            </div>
            {profile.createdAt && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Trust Score Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Trust Score</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">{profile.trustScore.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">/ 5</span>
                </div>
              </div>
              <button className="text-gray-600 hover:text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <TrustBar label="Communication" value={profile.reviewsCount > 0 ? profile.ratingsSum.communication / profile.reviewsCount : 0} />
              <TrustBar label="Technical Skills" value={profile.reviewsCount > 0 ? profile.ratingsSum.technicalSkills / profile.reviewsCount : 0} />
              <TrustBar label="Reliability" value={profile.reviewsCount > 0 ? profile.ratingsSum.reliability / profile.reviewsCount : 0} />
              <TrustBar label="Teamwork" value={profile.reviewsCount > 0 ? profile.ratingsSum.teamwork / profile.reviewsCount : 0} />
            </div>

            <p className="text-xs text-gray-500 text-center">{profile.reviewsCount} peer review{profile.reviewsCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-gray-300">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(skill => (
                  <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-gray-300">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ─── RIGHT CONTENT ───────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Tabs */}
          <div className="border-b border-[#30363d] flex gap-1">
            {(['overview', 'projects', 'reviews'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-[#f78166] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab}
                {tab === 'projects' && projects.length > 0 && (
                  <span className="ml-2 text-xs bg-[#30363d] text-gray-400 px-1.5 py-0.5 rounded-full font-mono">{projects.length}</span>
                )}
                {tab === 'reviews' && reviews.length > 0 && (
                  <span className="ml-2 text-xs bg-[#30363d] text-gray-400 px-1.5 py-0.5 rounded-full font-mono">{reviews.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ─── OVERVIEW TAB ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-5">
              {/* Contribution Graph */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-white">
                    {/* count computed in ContributionGraph */}
                    contributions in the last year
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                </div>
                <ContributionGraph username={profile.githubUsername} />
              </div>

              {/* Pinned Repositories */}
              {pinnedRepos.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-gray-300">Pinned repositories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pinnedRepos.map(repo => (
                      <a
                        key={repo.name}
                        href={repo.url || `https://github.com/${profile.githubUsername}/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col gap-2 p-4 bg-[#161b22] border border-[#30363d] rounded-xl hover:border-[#8b949e] transition-colors no-underline group"
                      >
                        <div className="flex items-center gap-2">
                          {/* Book icon */}
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e">
                            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
                          </svg>
                          <span className="text-sm font-semibold text-[#58a6ff] group-hover:underline truncate">{repo.name}</span>
                          <span className="ml-auto flex-shrink-0 text-[10px] border border-[#30363d] text-gray-500 rounded-full px-1.5 py-0.5">
                            {repo.isPrivate ? 'Private' : 'Public'}
                          </span>
                        </div>
                        {repo.description && (
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
                          {repo.language && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getLangColor(repo.language) }} />
                              <span>{repo.language}</span>
                            </div>
                          )}
                          {repo.stars > 0 && (
                            <div className="flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                              <span>{repo.stars}</span>
                            </div>
                          )}
                          {repo.forks !== undefined && repo.forks > 0 && (
                            <div className="flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
                              <span>{repo.forks}</span>
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── PROJECTS TAB ─────────────────────────────────── */}
          {activeTab === 'projects' && (
            <div className="flex flex-col gap-3">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                  <p className="text-sm">No projects yet</p>
                </div>
              ) : (
                projects.map(proj => {
                  const isOwner = proj.ownerId?.githubUsername === profile.githubUsername;
                  const statusColor: Record<string, string> = {
                    Active: 'text-[#2ea043] border-[#2ea043]/30 bg-[#2ea043]/10',
                    Recruiting: 'text-[#58a6ff] border-[#58a6ff]/30 bg-[#58a6ff]/10',
                    Completed: 'text-gray-400 border-[#30363d] bg-[#21262d]',
                    Archived: 'text-gray-500 border-[#30363d] bg-[#21262d]',
                  };
                  const allMembers = [
                    proj.ownerId,
                    ...(proj.members || []).filter(m => m._id !== proj.ownerId?._id),
                  ].filter(Boolean);
                  return (
                    <div
                      key={proj._id}
                      onClick={() => router.push(`/workspace/${proj._id}`)}
                      className="flex flex-col gap-3 p-4 bg-[#161b22] border border-[#30363d] rounded-xl hover:border-[#58a6ff] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[#58a6ff] font-semibold text-sm hover:underline">{proj.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#21262d] border border-[#30363d] text-gray-300">
                              {proj.category}
                            </span>
                            <span className="text-xs text-gray-500">· {isOwner ? 'Project Owner' : 'Teammate'}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{proj.description}</p>
                          {(proj.requiredSkills.length > 0 || proj.requiredRoles.length > 0) && (
                            <div className="flex flex-wrap gap-1.5">
                              {proj.requiredSkills.slice(0, 3).map(s => (
                                <span key={s} className="text-[11px] px-2 py-0.5 bg-[#0d1117] border border-[#30363d] text-gray-400 rounded-full">{s}</span>
                              ))}
                              {proj.requiredRoles.slice(0, 2).map(r => (
                                <span key={r} className="text-[11px] px-2 py-0.5 bg-[#0d1117] border border-[#30363d] text-gray-400 rounded-full">{r}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusColor[proj.status] || statusColor.Archived}`}>
                          {proj.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#30363d]/60">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {allMembers.slice(0, 5).map(m => (
                              m.avatarUrl ? (
                                <img key={m._id} src={m.avatarUrl} alt={m.name} title={m.name} className="w-6 h-6 rounded-full border-2 border-[#161b22]" />
                              ) : (
                                <div key={m._id} title={m.name} className="w-6 h-6 rounded-full bg-[#6e40c9] text-white flex items-center justify-center text-[10px] font-bold border-2 border-[#161b22]">
                                  {m.name?.substring(0, 1).toUpperCase()}
                                </div>
                              )
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{allMembers.length}/{proj.maxTeamSize} members</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ─── REVIEWS TAB ──────────────────────────────────── */}
          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-3">
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  <p className="text-sm">No reviews received yet</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review._id} className="flex flex-col gap-3 p-4 bg-[#161b22] border border-[#30363d] rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {review.reviewerId?.avatarUrl ? (
                          <img src={review.reviewerId.avatarUrl} alt={review.reviewerId.name} className="w-7 h-7 rounded-full border border-[#30363d]" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#6e40c9] text-white flex items-center justify-center text-xs font-bold border border-[#30363d]">
                            {review.reviewerId?.name?.substring(0, 1).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-semibold text-[#58a6ff]">{review.reviewerId?.githubUsername || 'anonymous'}</span>
                          <span className="text-gray-500">on</span>
                          <span className="text-gray-300">{review.projectId?.title || 'Unknown Project'}</span>
                        </div>
                      </div>
                      <StarRating score={avgRating(review)} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-400 italic leading-relaxed">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Communication: {review.communication}/5</span>
                      <span>Technical: {review.technicalSkills}/5</span>
                      <span>Reliability: {review.reliability}/5</span>
                      <span>Teamwork: {review.teamwork}/5</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* ─── EDIT PROFILE MODAL ─────────────────────────────── */}
      {isOwnProfile && isEditing && (
        <div className="fixed inset-0 bg-[#0d1117]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-lg rounded-2xl p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
              {[
                { label: 'Full Name', value: editName, onChange: setEditName, type: 'input' },
              ].map(({ label, value, onChange }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-400">{label}</label>
                  <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff] transition-colors" value={value} onChange={(e) => onChange(e.target.value)} required />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Bio</label>
                <textarea className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff] transition-colors" rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Availability Status</label>
                <select className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editStatus} onChange={(e) => setEditStatus(e.target.value as ProfileData['status'])}>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Looking for Team">Looking for Team</option>
                  <option value="Looking for Projects">Looking for Projects</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Skills <span className="text-gray-600">(comma-separated)</span></label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editSkillsStr} onChange={(e) => setEditSkillsStr(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Preferred Roles <span className="text-gray-600">(comma-separated)</span></label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editRolesStr} onChange={(e) => setEditRolesStr(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 rounded-lg bg-[#21262d] border border-[#30363d] text-sm text-gray-300 hover:border-[#8b949e] transition-colors">Cancel</button>
                <button type="submit" className="btn-primary" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
