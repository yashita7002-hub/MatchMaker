import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileData, ProjectItem } from './ProfileTypes';

interface ProfileProjectsTabProps {
  profile: ProfileData;
  projects: ProjectItem[];
}

export function ProfileProjectsTab({ profile, projects }: ProfileProjectsTabProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      {projects.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-white/15">
          <p className="text-slate-400 text-xs">No active project affiliations logged yet.</p>
        </div>
      ) : (
        projects.map(proj => {
          const isOwner = proj.ownerId?.githubUsername === profile.githubUsername;
          const allMembers = [
            proj.ownerId,
            ...(proj.members || []).filter(m => m._id !== proj.ownerId?._id),
          ].filter(Boolean);

          return (
            <div
              key={proj._id}
              onClick={() => router.push(`/workspace/${proj._id}`)}
              className="glass-card-hover p-6 rounded-2xl flex flex-col gap-3 cursor-pointer group border border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {proj.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-400">
                      {proj.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      • {isOwner ? 'Lead Founder' : 'Squad Member'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{proj.description}</p>
                </div>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  {proj.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {allMembers.slice(0, 4).map(m => (
                      <img
                        key={m._id}
                        src={m.avatarUrl || 'https://github.com/ghost.png'}
                        alt={m.name}
                        className="w-6 h-6 rounded-full border-2 border-[#0b1326] object-cover"
                      />
                    ))}
                  </div>
                  <span className="font-mono text-slate-400">{allMembers.length} builders</span>
                </div>
                <span className="text-cyan-400 font-semibold group-hover:underline">Open Workspace →</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
