"use client";
import React from 'react';
import { Task, WorkspaceUser } from './WorkspaceTypes';

interface KanbanTabProps {
  tasks: Task[];
  members: WorkspaceUser[];
  draggedTaskId: string | null;
  dropTargetStatus: Task['status'] | null;
  onSetDraggedTaskId: (id: string | null) => void;
  onSetDropTargetStatus: (status: Task['status'] | null) => void;
  onMoveTask: (taskId: string, newStatus: Task['status']) => void;
  onOpenCreateTask: () => void;
}

const COLUMNS: { key: Task['status']; label: string; badge: string; dot: string }[] = [
  { key: 'todo',        label: 'To Do',       badge: 'text-slate-400',  dot: 'bg-slate-400'  },
  { key: 'in_progress', label: 'In Progress', badge: 'text-cyan-400',   dot: 'bg-cyan-400'   },
  { key: 'review',      label: 'In Review',   badge: 'text-amber-400',  dot: 'bg-amber-400'  },
  { key: 'done',        label: 'Done',        badge: 'text-emerald-400',dot: 'bg-emerald-400'},
];

const PREV: Record<Task['status'], Task['status'] | null> = {
  todo: null, in_progress: 'todo', review: 'in_progress', done: 'review',
};
const NEXT: Record<Task['status'], Task['status'] | null> = {
  todo: 'in_progress', in_progress: 'review', review: 'done', done: null,
};

export default function KanbanTab({ tasks, draggedTaskId, dropTargetStatus, onSetDraggedTaskId, onSetDropTargetStatus, onMoveTask, onOpenCreateTask }: KanbanTabProps) {
  return (
    <div className="flex flex-col flex-1 gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Sprint Tasks &amp; Milestones</h3>
          <p className="text-xs text-slate-400 font-mono">Drag or click arrows to move tasks across sprint stages</p>
        </div>
        <button
          onClick={onOpenCreateTask}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          + Add Sprint Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-start">
        {COLUMNS.map(({ key: col, label, badge, dot }) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); onSetDropTargetStatus(col); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onSetDropTargetStatus(null); }}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                if (taskId) void onMoveTask(taskId, col);
                onSetDraggedTaskId(null);
                onSetDropTargetStatus(null);
              }}
              className={`glass-panel p-4 rounded-2xl flex flex-col gap-3 min-h-[460px] border transition-colors ${dropTargetStatus === col ? 'border-purple-400/60 bg-purple-500/5' : 'border-white/10'}`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${badge}`}>{label}</h4>
                </div>
                <span className="text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>

              <div className="flex flex-col gap-2.5 flex-1">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task._id); onSetDraggedTaskId(task._id); }}
                    onDragEnd={() => { onSetDraggedTaskId(null); onSetDropTargetStatus(null); }}
                    className={`bg-[#020617]/80 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2 hover:border-cyan-400/40 transition-all shadow-md group cursor-grab active:cursor-grabbing ${draggedTaskId === task._id ? 'opacity-40' : ''}`}
                  >
                    <h5 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug">{task.title}</h5>
                    {task.description && <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>}
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        {task.assignedUserName && <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">{task.assignedUserName.split(' ')[0]}</span>}
                        {task.dueDate && <span className="text-[10px] font-mono text-slate-500">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                      <div className="flex gap-1">
                        {PREV[col] && (
                          <button onClick={() => onMoveTask(task._id, PREV[col]!)} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors" title="Move backwards">←</button>
                        )}
                        {NEXT[col] && (
                          <button onClick={() => onMoveTask(task._id, NEXT[col]!)} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 flex items-center justify-center text-xs transition-colors" title="Move forwards">→</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl min-h-[90px]">
                    <span className="text-[11px] font-mono text-slate-500">No active tasks</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
