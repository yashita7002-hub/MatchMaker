import React from 'react';
import Link from 'next/link';
import { DashboardData, DashboardProject, DashboardUser, memberProgress } from './DashboardTypes';
import { getStatusColor, getCategoryColor, timeAgo } from '@/lib/status-helpers';

interface ActiveProjectsSectionProps {
  data: DashboardData | null;
}

export function ActiveProjectsSection({ data }: ActiveProjectsSectionProps) {
  return (
    <section className="flex flex-col gap-6 md:gap-10 mt-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl md:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight text-left">
            Active Collaborators
          </h2>
          <p className="text-sm font-semibold text-slate-300">
            Teams and open source ventures you are contributing to
          </p>
        </div>
      </div>

      {data?.activeTeams.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center border-dashed border-white/15">
          <p className="text-sm font-semibold text-slate-300">
            You have not joined any other squads yet. Explore open pitches to apply!
          </p>
          <Link
            href="/projects"
            className="inline-block mt-3 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Browse Active Projects →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-5 xl:gap-6 mt-8">
          {data?.activeTeams.map((project: DashboardProject & { ownerId: DashboardUser; updatedAt?: string }) => {
            const progress = memberProgress(project.members.length, project.maxTeamSize);

            return (
              <div
                key={project._id}
                className="glass-card-hover border border-indigo-400/20 bg-[#0b1326]/70 p-5 md:p-6 rounded-2xl flex flex-col gap-5 relative overflow-hidden group"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border mb-2 ${getCategoryColor(project.category)}`}>
                      {project.category}
                    </span>
                    <h3 className="text-lg md:text-xl font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                      {project.title}
                    </h3>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-300 leading-6 line-clamp-3 min-h-[4.5rem]">
                  {project.description || `Project led by ${project.ownerId?.name || 'Project Lead'}.`}
                </p>

                {(project.requiredSkills.length > 0 || project.requiredRoles.length > 0) && (
                  <div className="flex flex-col gap-2">
                    {project.requiredSkills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {project.requiredSkills.slice(0, 4).map(skill => (
                            <span key={skill} className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-400/20 text-[11px] font-medium text-indigo-200">
                              {skill}
                            </span>
                          ))}
                          {project.requiredSkills.length > 4 && (
                            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-400">
                              +{project.requiredSkills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {project.requiredRoles.length > 0 && (
                      <p className="text-xs text-slate-400">
                        Team roles: <span className="font-semibold text-slate-200">{project.requiredRoles.slice(0, 2).join(', ')}</span>
                        {project.requiredRoles.length > 2 && ` +${project.requiredRoles.length - 2}`}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map(member => (
                        <img
                          key={member._id}
                          src={member.avatarUrl || 'https://github.com/ghost.png'}
                          alt={member.name}
                          title={member.name}
                          className="w-6 h-6 rounded-full border-2 border-[#0b1326] object-cover"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      {project.members.length} / {project.maxTeamSize} builders
                    </span>
                    <span className="ml-auto text-[11px] font-semibold text-slate-400">
                      Updated {project.updatedAt ? timeAgo(project.updatedAt) : 'recently'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#020617]/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={`/workspace/${project._id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-tight transition-colors duration-200"
                >
                  Open Collaborative Workspace
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
