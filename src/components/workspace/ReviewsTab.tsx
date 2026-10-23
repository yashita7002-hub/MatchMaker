"use client";
import React from 'react';
import { WorkspaceProject, WorkspaceUser } from './WorkspaceTypes';

interface ReviewsTabProps {
  project: WorkspaceProject;
  user: WorkspaceUser | null;
  targetReviewee: WorkspaceUser | null;
  onSelectReviewee: (member: WorkspaceUser | null) => void;
  reviewedTeammates: string[];
  reviewStatusText: string;
  communication: number;
  onChangeCommunication: (val: number) => void;
  technicalSkills: number;
  onChangeTechnicalSkills: (val: number) => void;
  reliability: number;
  onChangeReliability: (val: number) => void;
  teamwork: number;
  onChangeTeamwork: (val: number) => void;
  reviewComment: string;
  onChangeReviewComment: (val: string) => void;
  submittingReview: boolean;
  onSubmitReview: (e: React.FormEvent) => void;
}

export default function ReviewsTab({
  project,
  user,
  targetReviewee,
  onSelectReviewee,
  reviewedTeammates,
  reviewStatusText,
  communication,
  onChangeCommunication,
  technicalSkills,
  onChangeTechnicalSkills,
  reliability,
  onChangeReliability,
  teamwork,
  onChangeTeamwork,
  reviewComment,
  onChangeReviewComment,
  submittingReview,
  onSubmitReview,
}: ReviewsTabProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-white/10">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Peer Collaboration Ratings</h3>
        <p className="text-xs text-slate-400 mt-1">Rate your teammates across communication, technical execution, and reliability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase text-slate-400">Select Teammate:</span>
          {project.members.filter(m => m._id !== user?._id).map(member => {
            const isReviewed = reviewedTeammates.includes(member._id);
            return (
              <button
                key={member._id}
                onClick={() => { if (!isReviewed) onSelectReviewee(member); }}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                  targetReviewee?._id === member._id
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md'
                    : 'bg-[#020617]/70 border-white/10 text-slate-300 hover:border-white/20'
                }`}
                disabled={isReviewed}
              >
                <div className="flex items-center gap-2.5">
                  <img src={member.avatarUrl || 'https://github.com/ghost.png'} alt="" className="w-7 h-7 rounded-full border border-white/20 object-cover" />
                  <span className="text-xs font-semibold">{member.name}</span>
                </div>
                {isReviewed && <span className="text-emerald-400 font-mono text-[10px]">✓ Reviewed</span>}
              </button>
            );
          })}
        </div>

        <div>
          {targetReviewee ? (
            <div className="p-6 rounded-2xl bg-[#020617]/70 border border-white/10 flex flex-col gap-5">
              <h4 className="text-sm font-bold text-white">Rate {targetReviewee.name}</h4>
              {reviewStatusText && (
                <div className="p-3 rounded-xl text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  {reviewStatusText}
                </div>
              )}
              <form onSubmit={onSubmitReview} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Communication (1-5)</label>
                    <input type="number" min="1" max="5" value={communication} onChange={(e) => onChangeCommunication(Number(e.target.value))} className="bg-[#0b1326] border border-white/10 text-white px-3 py-2 rounded-xl text-xs" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Technical Skills (1-5)</label>
                    <input type="number" min="1" max="5" value={technicalSkills} onChange={(e) => onChangeTechnicalSkills(Number(e.target.value))} className="bg-[#0b1326] border border-white/10 text-white px-3 py-2 rounded-xl text-xs" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Reliability (1-5)</label>
                    <input type="number" min="1" max="5" value={reliability} onChange={(e) => onChangeReliability(Number(e.target.value))} className="bg-[#0b1326] border border-white/10 text-white px-3 py-2 rounded-xl text-xs" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Teamwork (1-5)</label>
                    <input type="number" min="1" max="5" value={teamwork} onChange={(e) => onChangeTeamwork(Number(e.target.value))} className="bg-[#0b1326] border border-white/10 text-white px-3 py-2 rounded-xl text-xs" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">Feedback Comments</label>
                  <textarea rows={3} value={reviewComment} onChange={(e) => onChangeReviewComment(e.target.value)} placeholder="Share specific strengths or highlights..." className="bg-[#0b1326] border border-white/10 text-white px-3 py-2 rounded-xl text-xs resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => onSelectReviewee(null)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">Cancel</button>
                  <button type="submit" className="btn-primary !text-xs !py-2 !px-5" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center text-slate-500 text-xs min-h-[220px] border border-dashed border-white/10 rounded-2xl">
              Select a teammate on the left to start rating their performance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
