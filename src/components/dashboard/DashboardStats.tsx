import React from 'react';
import TrustStars from '@/components/TrustStars';
import { UserProfile } from '@/types';
import { DashboardData } from './DashboardTypes';

interface DashboardStatsProps {
  user: UserProfile;
  data: DashboardData | null;
  activeProjectCount: number;
  activeTeamCount: number;
  pendingInbound: number;
  onPitchClick: () => void;
  onFeedClick: () => void;
}

export function DashboardStats({
  user,
  data,
  activeProjectCount,
  activeTeamCount,
  pendingInbound,
  onPitchClick,
  onFeedClick,
}: DashboardStatsProps) {
  return (
    <>
      {/* ── Top Hero Greeting Banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-white/[0.08] bg-[#0b1326]/80">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={user.avatarUrl || 'https://github.com/ghost.png'}
                alt={user.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-cyan-400/40 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0b1326]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-widest">Builder Command Center</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">@{user.githubUsername}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
                Welcome back, <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">{user.name}</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Ready to assemble your squad or push the frontier? Review incoming applications, track squads, or discover your next co-builder.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onPitchClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold transition-colors duration-200 shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Pitch Idea
            </button>
            <button
              type="button"
              onClick={onFeedClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0b1326]/80 hover:bg-[#162344] border border-white/15 text-slate-200 text-sm font-semibold backdrop-blur-xl transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Discover Feed
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Counters Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 mt-18">
        {/* My Pitches */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-slate-300">
              My Pitches
            </span>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tight">
              {data?.ownedProjects.length ?? 0}
            </span>
            <span className="text-sm font-bold text-cyan-400">
              ({activeProjectCount} active)
            </span>
          </div>
        </div>

        {/* Workspaces */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-slate-300">
              Workspaces
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tight">
              {activeTeamCount}
            </span>
            <span className="text-sm font-semibold text-blue-400">
              collaborative squads
            </span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-slate-300">
              Pending Review
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tight">
              {pendingInbound}
            </span>
            <span className="text-sm font-semibold text-purple-400">
              inbound candidates
            </span>
          </div>
        </div>

        {/* Trust Index */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-slate-300">
              Trust Index
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">
                {user.trustScore?.toFixed(1) || '5.0'}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
            </div>
            <TrustStars score={user.trustScore || 5} max={5} />
          </div>
        </div>
      </div>
    </>
  );
}
