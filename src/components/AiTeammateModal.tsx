"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { CandidateRecommendation, ProjectSummary } from '@/types';
import AiCandidateCard from './ai/AiCandidateCard';
import AiInviteConfirmModal from './ai/AiInviteConfirmModal';

interface AiTeammateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectSummary | null;
  onInviteSent?: () => void;
}

export default function AiTeammateModal({
  isOpen,
  onClose,
  project,
  onInviteSent,
}: AiTeammateModalProps) {
  const { globalSocket } = useApp();
  const [recommendations, setRecommendations] = useState<CandidateRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invitation tracking per candidate
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});

  // Confirmation modal state
  const [confirmCandidate, setConfirmCandidate] = useState<CandidateRecommendation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Fetch recommendations when opened
  const fetchRecs = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}/recommendations`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch recommendations (${res.status})`);
      }
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error('Error fetching AI recommendations:', err);
      setError(err.message || 'Unable to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isOpen || !project) {
      setRecommendations([]);
      setError(null);
      return;
    }
    fetchRecs();
  }, [isOpen, project, fetchRecs]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmCandidate) {
          setConfirmCandidate(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmCandidate, onClose]);

  if (!isOpen || !project) return null;

  // Open invite confirmation dialog
  const handleOpenConfirm = (rec: CandidateRecommendation) => {
    setConfirmCandidate(rec);
    setInviteError(null);
  };

  // Submit invitation
  const handleConfirmInvite = async (role: string, message: string) => {
    if (!confirmCandidate || !project) return;
    setIsSubmitting(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/projects/${project._id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: confirmCandidate.candidate._id,
          role,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInvitedMap(prev => ({ ...prev, [confirmCandidate.candidate._id]: true }));

      if (data.notification && globalSocket) {
        globalSocket.emit('send-notification', data.notification);
      }

      if (onInviteSent) onInviteSent();
      setConfirmCandidate(null);
    } catch (err: any) {
      console.error('Error submitting invitation:', err);
      setInviteError(err.message || 'An error occurred while sending the invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-fade-in">
      <div
        className="glass-panel rounded-3xl p-6 md:p-8 max-w-4xl w-full border border-white/15 shadow-2xl relative flex flex-col gap-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-cyan-400/30 text-cyan-300 shadow-sm">
                <svg className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m12 3-1.4 4.2a5 5 0 0 1-3.2 3.2L3 12l4.4 1.6a5 5 0 0 1 3.2 3.2L12 21l1.4-4.2a5 5 0 0 1 3.2-3.2L21 12l-4.4-1.6a5 5 0 0 1-3.2-3.2L12 3Z" />
                </svg>
                Google Gemini AI Matchmaker
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              Find Teammates with AI for{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {project.title}
              </span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Candidates are evaluated using hybrid semantic AI intelligence and verified developer code footprints, repository languages, trust ratings, and requested project roles.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-cyan-400">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400/20 to-purple-500/20 blur-sm animate-pulse" />
            </div>
            <div className="text-center">
              <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider block">
                GEMINI 3.5 AI ANALYZING BUILDER ECOSYSTEM...
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Evaluating skills synergy, repo dynamics, and team role compatibility.
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-6 glass-panel rounded-2xl border border-rose-500/20 bg-rose-500/5">
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <button
              onClick={fetchRecs}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors"
            >
              Retry AI Search
            </button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-16 px-6 glass-panel rounded-2xl border-dashed border-white/15">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white">No eligible candidate matches found</p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
              All registered developers may already be members of this squad or have pending invites/applications. You can also update the project's required skills to widen matching.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
              <span>{recommendations.length} Candidate Matches Found</span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Ranked by AI & Code Footprint
              </span>
            </div>

            {recommendations.map(rec => (
              <AiCandidateCard
                key={rec.candidate._id}
                rec={rec}
                isInvited={Boolean(invitedMap[rec.candidate._id])}
                onOpenConfirm={handleOpenConfirm}
              />
            ))}
          </div>
        )}

        {/* ── Confirmation Sub-Modal ── */}
        <AiInviteConfirmModal
          isOpen={Boolean(confirmCandidate)}
          candidate={confirmCandidate}
          project={project}
          isSubmitting={isSubmitting}
          error={inviteError}
          onClose={() => setConfirmCandidate(null)}
          onConfirm={handleConfirmInvite}
        />
      </div>
    </div>
  );
}
