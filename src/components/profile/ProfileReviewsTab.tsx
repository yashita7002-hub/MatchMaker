import React from 'react';
import { ReviewItem, avgRating } from './ProfileTypes';

interface ProfileReviewsTabProps {
  reviews: ReviewItem[];
}

const StarRating = ({ score }: { score: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <svg
        key={i}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={i <= Math.round(score) ? '#38bdf8' : 'none'}
        stroke={i <= Math.round(score) ? '#38bdf8' : '#475569'}
        strokeWidth="2"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
);

export function ProfileReviewsTab({ reviews }: ProfileReviewsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {reviews.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-white/15">
          <p className="text-slate-400 text-xs">No peer teammate reviews logged yet.</p>
        </div>
      ) : (
        reviews.map(review => (
          <div key={review._id} className="glass-panel p-6 rounded-2xl flex flex-col gap-3 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={review.reviewerId?.avatarUrl || 'https://github.com/ghost.png'}
                  alt=""
                  className="w-8 h-8 rounded-full border border-white/20 object-cover"
                />
                <div>
                  <p className="text-xs font-bold text-white">@{review.reviewerId?.githubUsername || 'collaborator'}</p>
                  <p className="text-[10px] font-mono text-cyan-400">on {review.projectId?.title || 'Collaborative Workspace'}</p>
                </div>
              </div>
              <StarRating score={avgRating(review)} />
            </div>

            {review.comment && (
              <p className="text-xs text-slate-300 italic bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                &ldquo;{review.comment}&rdquo;
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400 pt-1">
              <span>Communication: {review.communication}/5</span>
              <span>Tech Skills: {review.technicalSkills}/5</span>
              <span>Reliability: {review.reliability}/5</span>
              <span>Teamwork: {review.teamwork}/5</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
