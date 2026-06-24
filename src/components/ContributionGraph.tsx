"use client";
import React from 'react';
import { GitHubCalendar } from 'react-github-calendar';

interface ContributionGraphProps {
  username: string;
}

export default function ContributionGraph({ username }: ContributionGraphProps) {
  return (
    <div className="w-full flex justify-center overflow-x-auto p-2" style={{ color: 'var(--text-secondary)' }}>
      <GitHubCalendar 
        username={username} 
        colorScheme="dark"
        hideColorLegend={false}
        hideTotalCount={false}
        theme={{
          dark: ['rgba(128, 128, 128, 0.1)', '#0e4429', '#006d32', '#26a641', '#39d353'],
        }}
      />
    </div>
  );
}
