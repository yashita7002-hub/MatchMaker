import React from 'react';
import { ProfileData, getStatusDot } from './ProfileTypes';
import { getStatusColor } from '@/lib/status-helpers';

interface ProfileSidebarProps {
  profile: ProfileData;
  isOwnProfile: boolean | null;
  isEditing: boolean;
  onEditClick: () => void;
}

const TrustBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-cyan-300 font-semibold">{value.toFixed(1)}</span>
    </div>
    <div className="h-1.5 bg-[#020617] rounded-full overflow-hidden border border-white/5">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-700"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
  </div>
);

export function ProfileSidebar({
  profile,
  isOwnProfile,
  isEditing,
  onEditClick,
}: ProfileSidebarProps) {
  return (
    <aside className="w-full flex flex-col gap-6">
      {/* Main Identity Card */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col gap-5 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img
              src={profile.avatarUrl || 'https://github.com/ghost.png'}
              alt={profile.name}
              className="w-28 h-28 rounded-2xl border-2 border-cyan-400/40 object-cover shadow-xl shadow-cyan-500/20"
            />
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0b1326] ${getStatusDot(profile.status)}`} />
          </div>

          <h1 className="text-xl font-extrabold text-white tracking-tight">{profile.name}</h1>
          <p className="text-xs font-mono text-cyan-400 mt-0.5">@{profile.githubUsername}</p>

          <div className="mt-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shadow-sm ${getStatusColor(profile.status)}`}>
              {profile.status}
            </span>
          </div>
        </div>

        {profile.bio && (
          <p className="text-xs text-slate-300 leading-relaxed text-center border-t border-white/10 pt-4">
            {profile.bio}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <a
            href={`https://github.com/${profile.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub Profile
          </a>

          {isOwnProfile && !isEditing && (
            <button
              onClick={onEditClick}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        {/* Meta stats */}
        <div className="flex flex-col gap-2 text-xs text-slate-400 pt-2 border-t border-white/10">
          {profile.location && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span>{profile.location}</span>
            </div>
          )}
          {profile.createdAt && (
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span>Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Trust Score Passport Card */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4 border border-white/10 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Trust Passport
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-white">{profile.trustScore.toFixed(1)}</span>
              <span className="text-slate-500 text-xs font-mono">/ 5.0</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <TrustBar label="Communication" value={profile.reviewsCount > 0 ? profile.ratingsSum.communication / profile.reviewsCount : profile.trustScore} />
          <TrustBar label="Technical Execution" value={profile.reviewsCount > 0 ? profile.ratingsSum.technicalSkills / profile.reviewsCount : profile.trustScore} />
          <TrustBar label="Reliability & Deadlines" value={profile.reviewsCount > 0 ? profile.ratingsSum.reliability / profile.reviewsCount : profile.trustScore} />
          <TrustBar label="Teamwork & Synergies" value={profile.reviewsCount > 0 ? profile.ratingsSum.teamwork / profile.reviewsCount : profile.trustScore} />
        </div>

        <p className="text-[11px] font-mono text-slate-500 text-center pt-1 border-t border-white/5">
          Verified across {profile.reviewsCount} peer collaboration{profile.reviewsCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Skills & Roles */}
      {profile.skills.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 flex flex-col gap-3 border border-white/10">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Tech Stack & Expertise
          </span>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map(skill => (
              <span key={skill} className="text-xs font-mono px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-cyan-300">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
