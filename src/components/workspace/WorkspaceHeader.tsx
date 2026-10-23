"use client";
import React from 'react';
import Link from 'next/link';
import { WorkspaceProject, ActiveTab } from './WorkspaceTypes';

interface WorkspaceHeaderProps {
  project: WorkspaceProject;
  activeTab: ActiveTab;
  userId?: string;
  onTabChange: (tab: ActiveTab) => void;
  onFindTeammates: () => void;
  onManageSquad: () => void;
  onMarkComplete: () => void;
}

export default function WorkspaceHeader({
  project,
  activeTab,
  userId,
  onTabChange,
  onFindTeammates,
  onManageSquad,
  onMarkComplete,
}: WorkspaceHeaderProps) {
  const isOwner = userId === project.ownerId._id;

  return (
    <>
      {/* Top Header Panel */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-5 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{project.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border bg-cyan-500/10 text-cyan-400 border-cyan-500/30 uppercase tracking-wider">
                Private Squad
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 uppercase tracking-wider">
                {project.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Socket Connected</span>
              </div>
              <span>•</span>
              <span>{project.members.length} Squad Builders</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex -space-x-2">
            {project.members.map((m) => (
              <Link key={m._id} href={`/profile/${m.githubUsername}`} title={m.name}>
                <img
                  src={m.avatarUrl || 'https://github.com/ghost.png'}
                  alt={m.name}
                  className="w-9 h-9 rounded-full border-2 border-[#0b1326] hover:border-cyan-400 transition-all object-cover cursor-pointer"
                />
              </Link>
            ))}
          </div>

          {isOwner && project.status !== 'Completed' && project.status !== 'Archived' && (
            <div className="flex gap-2 items-center flex-wrap">
              <button
                type="button"
                onClick={onFindTeammates}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-blue-500/20 hover:from-purple-500/35 hover:via-cyan-500/35 hover:to-blue-500/35 border border-cyan-400/40 text-cyan-200 hover:text-white text-xs font-semibold shadow-sm transition-all"
              >
                <svg className="w-3.5 h-3.5 text-cyan-300 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m12 3-1.4 4.2a5 5 0 0 1-3.2 3.2L3 12l4.4 1.6a5 5 0 0 1 3.2 3.2L12 21l1.4-4.2a5 5 0 0 1 3.2-3.2L21 12l-4.4-1.6a5 5 0 0 1-3.2-3.2L12 3Z" />
                </svg>
                Find Teammates with AI
              </button>
              <button
                onClick={onManageSquad}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors"
              >
                Manage Squad
              </button>
              {project.status === 'Active' && (
                <button
                  onClick={onMarkComplete}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all"
                >
                  Mark Complete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Tab Bar */}
      <nav aria-label="TeamHub sections" className="flex flex-wrap gap-2 border-b border-white/10">
        {(['chat', 'kanban', 'discussions', 'vault', 'expenses', 'reviews', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => onTabChange(tab)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab
                ? 'border-purple-400 bg-purple-500/10 text-purple-300'
                : 'border-transparent text-slate-400 hover:border-white/20 hover:text-white'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>
    </>
  );
}

const TAB_LABELS: Record<ActiveTab, React.ReactNode> = {
  chat: (
    <>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      Real-Time Chat
    </>
  ),
  kanban: (
    <>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
      Kanban Sprint
    </>
  ),
  discussions: (
    <>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      Discussions
    </>
  ),
  vault: (
    <>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      Resource Vault
    </>
  ),
  expenses: (
    <>
      <span className="font-bold text-cyan-400">$</span>
      Budget &amp; Costs
    </>
  ),
  reviews: (
    <>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
      Peer Ratings
    </>
  ),
  analytics: (
    <>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      Squad Analytics
    </>
  ),
};
