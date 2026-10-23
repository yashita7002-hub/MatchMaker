"use client";

import React, { Suspense } from 'react';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center py-32 text-cyan-400 font-mono text-sm">INITIALIZING...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
