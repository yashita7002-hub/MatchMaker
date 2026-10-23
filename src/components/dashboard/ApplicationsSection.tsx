import React from 'react';
import { DashboardData } from './DashboardTypes';
import { getStatusColor, timeAgo } from '@/lib/status-helpers';

interface ApplicationsSectionProps {
  data: DashboardData | null;
  handleApplicationAction: (appId: string, status: 'Accepted' | 'Rejected') => void;
  handleInvitationAction: (inviteId: string, status: 'Accepted' | 'Declined') => void;
}

export function ApplicationsSection({
  data,
  handleApplicationAction,
  handleInvitationAction,
}: ApplicationsSectionProps) {
  return (
    <div className="flex flex-col gap-10 w-full">
      {/* ── Section: Incoming Applications ── */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Incoming Applications</h2>
          <p className="text-sm font-semibold text-slate-300 mt-1">Review people who want to join your projects.</p>
        </div>
        {data?.incomingApplications.length !== 0 && (
          <div className="flex flex-col gap-4">
            {data?.incomingApplications.map(app => (
              <div key={app._id} className="glass-panel rounded-2xl p-5 md:p-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={app.userId.avatarUrl || 'https://github.com/ghost.png'}
                      alt=""
                      className="w-11 h-11 rounded-full border border-white/20 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{app.userId.name}</p>
                      <p className="text-xs font-mono text-slate-400">@{app.userId.githubUsername}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                  <p className="text-slate-400">Project: <span className="font-semibold text-white">{app.projectId.title}</span></p>
                  <p className="text-slate-400">Role: <span className="font-semibold text-cyan-300">{app.role}</span></p>
                  {app.createdAt && <p className="text-slate-400">{timeAgo(app.createdAt)}</p>}
                </div>
                {app.coverLetter && (
                  <p className="text-sm leading-relaxed text-slate-300 bg-white/5 p-3 rounded-xl">
                    &ldquo;{app.coverLetter}&rdquo;
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplicationAction(app._id, 'Accepted')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplicationAction(app._id, 'Rejected')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Team Invitations Panel ── */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.08]">
        <div className="px-5 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm md:text-base font-black text-purple-400 uppercase tracking-wide">
              Direct Invitations
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
            {data?.myInvitations.length ?? 0}
          </span>
        </div>

        <div className="p-6">
          {data?.myInvitations.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-4">
              No pending squad invitations.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {data?.myInvitations.map(invite => (
                <div
                  key={invite._id}
                  className="p-4 rounded-xl bg-[#020617]/40 border border-white/[0.06] flex flex-col gap-4"
                >
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-white">
                      {invite.projectId?.ownerId?.name ?? 'Squad Lead'}
                    </span>
                    {' '}invited you to build{' '}
                    <span className="font-bold text-cyan-300">
                      {invite.projectId?.title ?? 'a project'}
                    </span>
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Role:</span>
                    <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                      {invite.role}
                    </span>
                  </div>

                  {invite.message && (
                    <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-300 flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Personal Message from Lead
                      </span>
                      <p className="italic text-slate-200 pl-3 border-l-2 border-cyan-400/40">
                        &ldquo;{invite.message}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleInvitationAction(invite._id, 'Accepted')}
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleInvitationAction(invite._id, 'Declined')}
                      className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── My Outbound Applications Panel ── */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.08]">
        <div className="px-5 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <h3 className="text-sm md:text-base font-black text-purple-400 uppercase tracking-wide">
              My Applications
            </h3>
          </div>

          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
            {data?.myApplications.length ?? 0}
          </span>
        </div>

        <div className="divide-y divide-white/10">
          {data?.myApplications.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6 px-4">
              No applications submitted yet.
            </p>
          ) : (
            <>
              {data?.myApplications.slice(0, 4).map(
                (app: {
                  _id: string;
                  projectId: { title: string };
                  role: string;
                  status: string;
                  createdAt: string;
                }) => (
                  <div
                    key={app._id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {app.projectId?.title ?? 'Unknown project'}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-cyan-400">
                          {app.role}
                        </span>
                        <span className="text-slate-500 text-[10px]">•</span>
                        <span className="text-[10px] text-slate-500">
                          {app.createdAt ? timeAgo(app.createdAt) : 'recently'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getStatusColor(app.status)}`}
                    >
                      {app.status === 'Pending' ? 'Pending' : app.status}
                    </span>
                  </div>
                )
              )}

              {data && data.myApplications.length > 4 && (
                <div className="p-3 text-center">
                  <span className="text-xs text-cyan-400 font-medium">
                    +{data.myApplications.length - 4} more active applications
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
