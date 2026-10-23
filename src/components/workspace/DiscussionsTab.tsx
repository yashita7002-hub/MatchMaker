"use client";
import React from 'react';
import { Discussion } from './WorkspaceTypes';

interface DiscussionsTabProps {
  discussions: Discussion[];
  selectedThread: Discussion | null;
  replyInput: string;
  onSelectThread: (thread: Discussion | null) => void;
  onReplyInputChange: (v: string) => void;
  onPostReply: (e: React.FormEvent) => void;
  onOpenNewThread: () => void;
}

export default function DiscussionsTab({
  discussions,
  selectedThread,
  replyInput,
  onSelectThread,
  onReplyInputChange,
  onPostReply,
  onOpenNewThread,
}: DiscussionsTabProps) {
  if (selectedThread) {
    return (
      <div className="flex flex-col gap-6">
        <button onClick={() => onSelectThread(null)} className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-2 w-max">
          ← Back to Threads
        </button>
        <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-white/10">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">{selectedThread.category}</span>
            <h3 className="text-xl font-bold text-white mt-3">{selectedThread.title}</h3>
            <p className="text-xs font-mono text-slate-400 mt-1">Started by {selectedThread.creatorName}</p>
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
            {selectedThread.replies.map((reply) => (
              <div key={reply._id} className="p-4 rounded-xl bg-[#020617]/70 border border-white/10 flex gap-3">
                <img src={reply.userAvatar || 'https://github.com/ghost.png'} alt="" className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white">{reply.userName}</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={onPostReply} className="flex gap-3 pt-2">
            <input type="text" className="flex-1 bg-[#020617]/70 border border-white/10 text-xs text-white rounded-xl px-4 py-2.5 outline-none focus:border-cyan-400 transition-colors" placeholder="Add to this discussion..." value={replyInput} onChange={(e) => onReplyInputChange(e.target.value)} required />
            <button type="submit" className="btn-primary !text-xs !py-2 !px-5">Reply</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Project Discussions</h3>
          <p className="text-xs text-slate-400 font-mono">Structured threads for planning, RFCs, and architecture</p>
        </div>
        <button onClick={onOpenNewThread} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all">
          + New Thread
        </button>
      </div>
      {discussions.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-white/15">
          <p className="text-slate-400 text-xs">No discussion threads logged yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {discussions.map((thread) => (
            <div key={thread._id} onClick={() => onSelectThread(thread)} className="glass-card-hover p-5 rounded-2xl cursor-pointer group border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{thread.title}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-400">{thread.category}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">By {thread.creatorName} • {new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">{thread.replies.length} replies</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
