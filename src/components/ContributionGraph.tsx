"use client";
import React from 'react';
import {GitHubCalendar} from "react-github-calendar";

interface ContributionGraphProps {
  username: string;
}

export default function ContributionGraph({
  username,
}: ContributionGraphProps) {
  return (
    <div className="w-full overflow-x-auto">
      <GitHubCalendar
        username={username}
        colorScheme="dark"
      />
    </div>
  );
}