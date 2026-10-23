import React from 'react';
import Link from 'next/link';
import { DashboardData, DashboardProject, memberProgress } from './DashboardTypes';
import { getStatusColor, getCategoryColor } from '@/lib/status-helpers';

interface MyProjectsSectionProps {
  data: DashboardData | null;
  activeProjectCount: number;
  expandedProjectId: string | null;
  deletingProjectId: string | null;
  setExpandedProjectId: (id: string | null) => void;
  onPitchClick: () => void;
  openEditProject: (project: DashboardProject) => void;
  handleDeleteProject: (projectId: string, projectTitle: string) => void;
  handleOpenRecommendations: (project: DashboardProject) => void;
  handleApplicationAction: (appId: string, status: 'Accepted' | 'Rejected') => void;
}

export function MyProjectsSection({
  data,
  activeProjectCount,
  expandedProjectId,
  deletingProjectId,
  setExpandedProjectId,
  onPitchClick,
  openEditProject,
  handleDeleteProject,
  handleOpenRecommendations,
  handleApplicationAction,
}: MyProjectsSectionProps) {
  return (
    <section className="flex flex-col gap-8 md:gap-9 mb-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="flex flex-col items-start text-left">
            <h2 className="text-xl md:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight text-left">
              My Projects
            </h2>
            <p className="text-sm font-semibold text-slate-300">
              Manage squads, invite verified talent, or configure milestones
            </p>
          </div>
        </div>

        {activeProjectCount > 0 && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
            {activeProjectCount} Active
          </span>
        )}
      </div>

      {data?.ownedProjects.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl flex flex-col items-center gap-4 text-center border-dashed border-white/15 mt-20">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              No active project pitches
            </h3>
            <p className="text-sm font-semibold text-slate-300 max-w-sm mt-1">
              Publish a project idea to unlock AI candidate matchmaking and collaborate in real-time workspaces.
            </p>
          </div>
          <button
            type="button"
            onClick={onPitchClick}
            className="btn-primary !py-2.5 !px-6 !text-xs font-bold active:scale-95 cursor-pointer"
          >
            Pitch Your First Idea
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-5 xl:gap-6">
          {data?.ownedProjects.map(project => {
            const projectApps = data.incomingApplications.filter(a => a.projectId?._id === project._id);
            const projectInvites = data.outgoingInvitations.filter(i => i.projectId?._id === project._id);
            const progress = memberProgress(project.members.length, project.maxTeamSize);
            const isExpanded = expandedProjectId === project._id;

            return (
              <div
                key={project._id}
                className="glass-card-hover border border-indigo-400/20 bg-[#0b1326]/70 p-5 md:p-6 rounded-2xl flex flex-col gap-5 relative overflow-hidden group"
              >
                {/* Header */}
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

                {/* Description */}
                <p className="text-sm font-medium text-slate-300 leading-6 line-clamp-3 min-h-[4.5rem]">
                  {project.description || 'No description provided.'}
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
                        Looking for <span className="font-semibold text-slate-200">{project.requiredRoles.slice(0, 2).join(', ')}</span>
                        {project.requiredRoles.length > 2 && ` +${project.requiredRoles.length - 2}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Member Capacity Progress */}
                <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 4).map(m => (
                          <img
                            key={m._id}
                            src={m.avatarUrl || 'https://github.com/ghost.png'}
                            alt={m.name}
                            title={m.name}
                            className="w-6 h-6 rounded-full border-2 border-[#0b1326] object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-slate-300">
                        {project.members.length} / {project.maxTeamSize} builders
                      </span>
                    </div>

                    {(projectApps.length > 0 || projectInvites.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setExpandedProjectId(isExpanded ? null : project._id)}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide' : 'Review'}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                          {projectApps.length + projectInvites.length}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="h-1.5 bg-[#020617]/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Primary Workspace CTA */}
                <Link
                  href={`/workspace/${project._id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-tight transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                  </svg>
                  Launch Collaborative Workspace
                </Link>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditProject(project)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title="Edit project details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project._id, project.title)}
                      disabled={deletingProjectId === project._id}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      title="Delete project"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenRecommendations(project)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-blue-500/20 hover:from-purple-500/35 hover:via-cyan-500/35 hover:to-blue-500/35 border border-cyan-400/40 text-cyan-200 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-cyan-300 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m12 3-1.4 4.2a5 5 0 0 1-3.2 3.2L3 12l4.4 1.6a5 5 0 0 1 3.2 3.2L12 21l1.4-4.2a5 5 0 0 1 3.2-3.2L21 12l-4.4-1.6a5 5 0 0 1-3.2-3.2L12 3Z" />
                    </svg>
                    Find Teammates with AI
                  </button>
                </div>

                {/* Expandable Applications / Invitations Panel */}
                {isExpanded && (projectApps.length > 0 || projectInvites.length > 0) && (
                  <div className="flex flex-col gap-3 pt-3 border-t border-white/10 animate-fade-in">
                    <span className="text-[11px] font-mono uppercase text-slate-400">Applications & Outbound Status</span>
                    {projectApps.map(app => (
                      <div key={app._id} className="bg-[#020617]/70 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={app.userId.avatarUrl || 'https://github.com/ghost.png'} alt="" className="w-7 h-7 rounded-full border border-white/20" />
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-white truncate block">{app.userId.name}</span>
                              <span className="text-[10px] text-cyan-400 font-mono">Applied for: {app.role}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => handleApplicationAction(app._id, 'Accepted')}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleApplicationAction(app._id, 'Rejected')}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        {app.coverLetter && (
                          <p className="text-[11px] text-slate-400 bg-white/5 p-2 rounded-lg italic">
                            &ldquo;{app.coverLetter}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}

                    {projectInvites.map(invite => (
                      <div key={invite._id} className="bg-[#020617]/70 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={invite.userId.avatarUrl || 'https://github.com/ghost.png'} alt="" className="w-7 h-7 rounded-full border border-white/20" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{invite.userId.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Invited as {invite.role}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${getStatusColor(invite.status)}`}>
                          {invite.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
