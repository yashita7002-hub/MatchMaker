import React from 'react';
import ContributionGraph from '@/components/ContributionGraph';
import { ProfileData, Repository, getLangColor } from './ProfileTypes';

interface ProfileOverviewTabProps {
  profile: ProfileData;
  pinnedRepos: Repository[];
}

export function ProfileOverviewTab({ profile, pinnedRepos }: ProfileOverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Contribution Graph */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">GitHub Activity Matrix</span>
          </div>
          <span className="text-xs font-mono text-cyan-400">Past 12 Months</span>
        </div>
        <div className="overflow-x-auto py-2">
          <ContributionGraph username={profile.githubUsername} />
        </div>
      </div>

      {/* Pinned Repositories */}
      {pinnedRepos.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider">Showcase Repositories</h3>
            <span className="text-xs font-mono text-slate-500">{pinnedRepos.length} featured</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedRepos.map(repo => (
              <a
                key={repo.name}
                href={repo.url || `https://github.com/${profile.githubUsername}/${repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card-hover p-5 rounded-2xl flex flex-col justify-between gap-3 group border border-white/10"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {repo.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                      {repo.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                  {repo.language && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLangColor(repo.language) }} />
                      <span>{repo.language}</span>
                    </div>
                  )}
                  {repo.stars > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      <span>{repo.stars}</span>
                    </div>
                  )}
                  {repo.forks !== undefined && repo.forks > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
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
  );
}
