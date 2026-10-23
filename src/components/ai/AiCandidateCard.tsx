"use client";
import React from 'react';
import Link from 'next/link';
import TrustStars from '@/components/TrustStars';
import { CandidateRecommendation } from '@/types';
import { getStatusColor } from '@/lib/status-helpers';

interface AiCandidateCardProps {
  rec: CandidateRecommendation;
  isInvited: boolean;
  onOpenConfirm: (rec: CandidateRecommendation) => void;
}

export default function AiCandidateCard({
  rec,
  isInvited,
  onOpenConfirm,
}: AiCandidateCardProps) {
  const { candidate } = rec;

  return (
    <div className="glass-card-hover p-5 md:p-6 rounded-2xl flex flex-wrap lg:flex-nowrap gap-5 items-center border border-white/10 group relative transition-all">
      {/* Candidate Profile Details */}
      <div className="flex gap-4 flex-1 min-w-[280px]">
        <Link
          href={`/profile/${candidate.githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 relative group/avatar"
          title="View public profile"
        >
          <img
            src={candidate.avatarUrl || 'https://github.com/ghost.png'}
            alt={candidate.name || candidate.githubUsername}
            className="w-14 h-14 rounded-2xl border-2 border-cyan-400/40 object-cover shadow-lg group-hover/avatar:scale-105 transition-all"
          />
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0b1326]" />
        </Link>

        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/profile/${candidate.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sm text-white hover:text-cyan-300 transition-colors"
            >
              {candidate.name || candidate.githubUsername}
            </Link>
            <span className="text-slate-400 font-mono text-xs">@{candidate.githubUsername}</span>
            {candidate.status && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getStatusColor(candidate.status)}`}>
                {candidate.status}
              </span>
            )}
            {rec.isAiGenerated && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border bg-purple-500/10 text-purple-300 border-purple-500/25">
                AI Analyzed
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {candidate.bio || 'Active developer and builder'}
          </p>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {candidate.skills.slice(0, 5).map(skill => (
                <span key={skill} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 5 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 text-slate-500">
                  +{candidate.skills.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Match Synergies */}
          {rec.reasons && rec.reasons.length > 0 && (
            <div className="mt-2 bg-[#020617]/70 border-l-2 border-cyan-400 pl-3 py-2 rounded-r-xl flex flex-col gap-1">
              <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Match Synergy:
              </span>
              {rec.reasons.map((reason, idx) => (
                <span key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{reason}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Match Metric & Actions */}
      <div className="flex flex-col gap-3 w-full lg:w-56 shrink-0 lg:border-l lg:border-white/10 lg:pl-6">
        <div className="flex lg:flex-col items-center lg:items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
              {rec.matchScore}%
            </span>
            <span className="text-xs text-slate-400 font-mono uppercase">Fit</span>
          </div>
          <div className="mt-1">
            <TrustStars score={candidate.trustScore || 0} max={5} />
          </div>
        </div>

        {/* Suggested Role */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Suggested Role:</span>
          <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-lg">
            {rec.suggestedRole || 'General Collaborator'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href={`/profile/${candidate.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-xl text-center text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-colors"
          >
            View Profile
          </Link>

          <button
            onClick={() => onOpenConfirm(rec)}
            disabled={isInvited}
            className={`w-full py-2 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              isInvited
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 active:scale-95'
            }`}
          >
            {isInvited ? (
              <>
                <span>✓</span>
                <span>Invitation Sent</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                <span>Invite to Team</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
