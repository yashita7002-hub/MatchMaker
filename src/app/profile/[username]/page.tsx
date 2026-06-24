"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import ContributionGraph from '@/components/ContributionGraph';
import TrustStars from '@/components/TrustStars';

interface ProfileData {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  bio: string;
  status: 'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects';
  skills: string[];
  roles: string[];
  trustScore: number;
  reviewsCount: number;
  repositories: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    url: string;
  }>;
}

const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'available') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (s === 'busy') return 'bg-red-500/10 text-red-400 border-red-500/30';
  if (s.includes('team')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
};

const getLangColor = (lang: string) => {
  const map: Record<string, string> = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
    Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
    Ruby: '#701516', PHP: '#4F5D95', Swift: '#ffac45',
  };
  return map[lang] || '#8b5cf6';
};

export default function Profile() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, refreshUser } = useApp();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState<'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects'>('Available');
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
        setEditName(data.user.name);
        setEditBio(data.user.bio || '');
        setEditStatus(data.user.status);
        setEditSkillsStr(data.user.skills.join(', '));
        setEditRolesStr(data.user.roles.join(', '));
      } else {
        setError('User profile not found.');
      }
    } catch (err) {
      setError('Network error. Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.username) {
      fetchProfile();
    }
  }, [params.username]);

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
      if (res.ok) {
        setIsEditing(false);
        fetchProfile();
        refreshUser();
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  const isOwnProfile = currentUser && currentUser.githubUsername === params.username;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-indigo-400">
        <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="glass-card w-full max-w-md p-10 text-center flex flex-col items-center gap-6">
          <h2 className="text-2xl font-heading font-bold text-red-400">Profile Not Found</h2>
          <p className="text-slate-400">{error || 'User not found.'}</p>
          <button onClick={() => router.push('/')} className="btn-primary">Back to Discover</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8 relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[40%] h-[35%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Profile Header */}
      <div className="glass-panel rounded-2xl p-8 flex flex-wrap gap-8 items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />

        <div className="relative">
          <img src={profile.avatarUrl} alt={profile.name} className="w-28 h-28 rounded-full border-4 border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-4 border-[#0b0f19]" />
        </div>

        <div className="flex flex-col gap-3 flex-1 min-w-[260px]">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-heading font-extrabold text-white">{profile.name}</h1>
            <span className="text-slate-500 text-lg">@{profile.githubUsername}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(profile.status)}`}>
              {profile.status}
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed">
            {profile.bio || 'This developer has not written a bio yet.'}
          </p>

          <div className="flex flex-wrap gap-6 mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Trust Score</span>
              <TrustStars score={profile.trustScore} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Completed Projects</span>
              <span className="text-lg font-bold text-white">{profile.reviewsCount}</span>
            </div>
          </div>
        </div>

        {isOwnProfile && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-secondary !py-2 !px-5 !text-sm absolute top-6 right-6">
            Edit Profile
          </button>
        )}
      </div>

      {/* Contribution Graph */}
      <div className="glass-panel rounded-2xl p-8">
        <h3 className="text-lg font-heading font-bold text-white mb-6">GitHub Contribution Graph</h3>
        <ContributionGraph username={profile.githubUsername} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
        {/* Skills & Roles */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              Verified Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.length > 0 ? (
                profile.skills.map(skill => (
                  <span key={skill} className="text-sm px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm">No skills cataloged yet.</span>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              Target Team Roles
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.roles.length > 0 ? (
                profile.roles.map(role => (
                  <span key={role} className="text-sm px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 font-medium border border-purple-500/20">
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm">No preferred roles specified.</span>
              )}
            </div>
          </div>
        </div>

        {/* GitHub Repositories */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="text-lg font-heading font-bold text-white">Public GitHub Repositories</h3>
          {profile.repositories.length === 0 ? (
            <p className="text-slate-400 text-sm">No public repositories detected for this user.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {profile.repositories.map(repo => (
                <div key={repo.name} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors group">
                  <div className="flex justify-between items-start">
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-indigo-300 font-semibold text-base hover:text-indigo-200 transition-colors group-hover:underline">
                      {repo.name}
                    </a>
                    <div className="flex items-center gap-1.5 text-sm text-yellow-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="font-bold">{repo.stars}</span>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-slate-400 leading-relaxed">{repo.description}</p>
                  )}
                  {repo.language && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: getLangColor(repo.language) }} />
                      <span className="font-medium">{repo.language}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-heading font-bold text-white">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Full Name</label>
                <input type="text" className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Bio</label>
                <textarea className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Availability Status</label>
                <select className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500" value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Looking for Team">Looking for Team</option>
                  <option value="Looking for Projects">Looking for Projects</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Skills (comma-separated)</label>
                <input type="text" className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" value={editSkillsStr} onChange={(e) => setEditSkillsStr(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Preferred Roles (comma-separated)</label>
                <input type="text" className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" value={editRolesStr} onChange={(e) => setEditRolesStr(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
