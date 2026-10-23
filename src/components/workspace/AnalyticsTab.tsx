"use client";
import React from 'react';

interface AnalyticsTabProps {
  analyticsLoading: boolean;
  analyticsData: any;
  analyticsError?: string | null;
}

export default function AnalyticsTab({
  analyticsLoading,
  analyticsData,
  analyticsError,
}: AnalyticsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {analyticsLoading ? (
        <div className="flex items-center justify-center py-20 text-cyan-400">
          <span className="text-xs font-mono">Aggregating squad telemetry...</span>
        </div>
      ) : analyticsError ? (
        <div className="glass-panel p-8 rounded-2xl text-center border-dashed border-rose-500/20 bg-rose-500/5">
          <p className="text-rose-300 text-xs">{analyticsError}</p>
        </div>
      ) : analyticsData?.analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-mono text-slate-400 uppercase">Progress</span>
            <div className="text-2xl font-black text-white mt-1">{analyticsData.analytics.projectProgress}%</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-mono text-slate-400 uppercase">Task Completion</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">{analyticsData.analytics.taskCompletionRate}%</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-mono text-slate-400 uppercase">Team Activity</span>
            <div className="text-2xl font-black text-purple-400 mt-1">{analyticsData.analytics.teamActivityCount}</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Expenses</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">${analyticsData.analytics.totalExpenses.toFixed(2)}</div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-10 rounded-2xl text-center border-dashed border-white/15">
          <p className="text-slate-400 text-xs">No analytics telemetry logged yet.</p>
        </div>
      )}
    </div>
  );
}
