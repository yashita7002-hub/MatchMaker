"use client";
import React, { useState, useEffect } from 'react';
import { CandidateRecommendation, ProjectSummary } from '@/types';

interface AiInviteConfirmModalProps {
  isOpen: boolean;
  candidate: CandidateRecommendation | null;
  project: ProjectSummary | null;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (role: string, message: string) => Promise<void>;
}

export default function AiInviteConfirmModal({
  isOpen,
  candidate,
  project,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: AiInviteConfirmModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [inviteMessage, setInviteMessage] = useState<string>('');

  useEffect(() => {
    if (candidate && project) {
      setSelectedRole(candidate.suggestedRole || project.requiredRoles?.[0] || 'General Collaborator');
      setInviteMessage(
        `Hi ${candidate.candidate.name || candidate.candidate.githubUsername}! We are building "${project.title}" and think your skills would be a great fit for our squad.`
      );
    }
  }, [candidate, project]);

  if (!isOpen || !candidate || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedRole.trim() || 'General Collaborator', inviteMessage.trim());
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="glass-panel rounded-2xl p-6 max-w-lg w-full border border-white/20 shadow-2xl flex flex-col gap-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">Send Squad Invitation</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Candidate Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <img
            src={candidate.candidate.avatarUrl || 'https://github.com/ghost.png'}
            alt={candidate.candidate.name}
            className="w-11 h-11 rounded-xl object-cover border border-cyan-400/40"
          />
          <div>
            <h4 className="text-sm font-bold text-white">
              {candidate.candidate.name || candidate.candidate.githubUsername}
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              @{candidate.candidate.githubUsername} • Fit: {candidate.matchScore}%
            </span>
          </div>
        </div>

        {/* Project Title */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono text-slate-400">Project</label>
          <div className="px-3 py-2 rounded-xl bg-[#020617] border border-white/15 text-xs text-white font-medium">
            {project.title}
          </div>
        </div>

        {/* Role Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono text-slate-400">Role for Candidate</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isSubmitting}
            className="bg-[#020617] border border-white/15 text-white text-xs px-3 py-2.5 rounded-xl outline-none focus:border-cyan-400"
          >
            {candidate.suggestedRole && !project.requiredRoles?.includes(candidate.suggestedRole) && (
              <option value={candidate.suggestedRole}>
                ★ Suggested: {candidate.suggestedRole}
              </option>
            )}
            {project.requiredRoles?.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
            <option value="General Collaborator">General Collaborator</option>
          </select>
        </div>

        {/* Optional Message */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-slate-400">Personal Invitation Note (Optional)</label>
            <span className="text-[10px] text-slate-500 font-mono">{inviteMessage.length}/500</span>
          </div>
          <textarea
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value.slice(0, 500))}
            disabled={isSubmitting}
            rows={3}
            className="bg-[#020617] border border-white/15 text-white text-xs p-3 rounded-xl outline-none focus:border-cyan-400 resize-none leading-relaxed"
            placeholder="Introduce your project and explain why you'd love them on your squad..."
          />
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2 px-4 rounded-xl text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <span>Confirm & Send Invite</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
