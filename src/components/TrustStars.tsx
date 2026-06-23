import React from 'react';

interface TrustStarsProps {
  score: number;
  max?: number;
}

export default function TrustStars({ score, max = 5 }: TrustStarsProps) {
  const roundedScore = Math.round(score * 2) / 2; 

  return (
    <div className="star-rating" title={`Trust Score: ${score > 0 ? score.toFixed(1) : 'No reviews'}/5.0`}>
      {Array.from({ length: max }).map((_, idx) => {
        const starVal = idx + 1;
        let fillType = 'empty'; 
        if (roundedScore >= starVal) {
          fillType = 'full';
        } else if (roundedScore + 0.5 === starVal) {
          fillType = 'half';
        }
        
        return (
          <span key={idx} className="star" style={{ display: 'inline-flex', alignItems: 'center' }}>
            {fillType === 'full' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            )}
            {fillType === 'half' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#halfGrad)" />
                <defs>
                  <linearGradient id="halfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="50%" stopColor="var(--warning)" />
                    <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            {fillType === 'empty' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            )}
          </span>
        );
      })}
      {score > 0 && <span style={{ marginLeft: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{score.toFixed(1)}</span>}
    </div>
  );
}
