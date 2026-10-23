import React from 'react';
import { DashboardProject } from './DashboardTypes';

interface ProjectEditModalProps {
  editingProject: DashboardProject | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editCategory: string;
  setEditCategory: (val: string) => void;
  editSkillsStr: string;
  setEditSkillsStr: (val: string) => void;
  editRolesStr: string;
  setEditRolesStr: (val: string) => void;
  editMaxTeamSize: string;
  setEditMaxTeamSize: (val: string) => void;
  editStatus: DashboardProject['status'];
  setEditStatus: (val: DashboardProject['status']) => void;
  savingProject: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProjectEditModal({
  editingProject,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editCategory,
  setEditCategory,
  editSkillsStr,
  setEditSkillsStr,
  editRolesStr,
  setEditRolesStr,
  editMaxTeamSize,
  setEditMaxTeamSize,
  editStatus,
  setEditStatus,
  savingProject,
  onClose,
  onSubmit,
}: ProjectEditModalProps) {
  if (!editingProject) return null;

  return (
    <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-white/15 shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Project Settings</span>
            <h2 className="text-xl font-bold text-white mt-0.5">Edit Project</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Title</label>
            <input
              type="text"
              className="bg-[#020617]/70 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 text-sm transition-colors"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Description</label>
            <textarea
              className="bg-[#020617]/70 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 text-sm transition-colors resize-none"
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Category</label>
            <select
              className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 text-sm"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            >
              <option value="College Project">College Project</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Startup">Startup</option>
              <option value="Open Source">Open Source</option>
              <option value="Research">Research</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">
              Required Skills <span className="text-slate-500 font-mono">(comma-separated)</span>
            </label>
            <input
              type="text"
              className="bg-[#020617]/70 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 text-sm transition-colors"
              value={editSkillsStr}
              onChange={(e) => setEditSkillsStr(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">
              Required Roles <span className="text-slate-500 font-mono">(comma-separated)</span>
            </label>
            <input
              type="text"
              className="bg-[#020617]/70 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 text-sm transition-colors"
              value={editRolesStr}
              onChange={(e) => setEditRolesStr(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Max Team Size</label>
              <input
                type="number"
                min={2}
                max={20}
                className="bg-[#020617]/70 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 text-sm"
                value={editMaxTeamSize}
                onChange={(e) => setEditMaxTeamSize(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Status</label>
              <select
                className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 text-sm"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as DashboardProject['status'])}
              >
                <option value="Recruiting">Recruiting</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              disabled={savingProject}
            >
              {savingProject ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
