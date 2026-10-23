"use client";
import React, { FormEvent } from "react";
import Link from "next/link";
import { Icon, LandingProject } from "./LandingTypes";

export interface ProjectDetailModalProps {
  project: LandingProject;
  userId?: string;
  onClose: () => void;
  appRole: string;
  appCover: string;
  appStatusText: string;
  onRoleChange: (v: string) => void;
  onCoverChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function ProjectDetailModal({
  project,
  userId,
  onClose,
  appRole,
  appCover,
  appStatusText,
  onRoleChange,
  onCoverChange,
  onSubmit,
}: ProjectDetailModalProps) {
  const isOwner = userId === project.ownerId._id;
  const isMember = project.members.some((m) => m._id === userId);

  return (
    <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="glass-panel bg-[#0b1326]/95 border border-white/15 w-full max-w-3xl rounded-3xl p-6 md:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#8c909f] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10"
          aria-label="Close modal"
        >
          <Icon name="close" size={18} />
        </button>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/20">
            {project.category}
          </span>
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              project.status === "Recruiting"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                : project.status === "Active"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-500/10 text-slate-400 border-slate-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                project.status === "Recruiting" ? "bg-emerald-400 animate-pulse" : "bg-blue-400"
              }`}
            />
            {project.status}
          </span>
        </div>

        {/* Title & Author */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{project.title}</h2>
          <div className="flex items-center gap-2.5 text-xs text-[#8c909f]">
            <span>Pitched by:</span>
            <img
              src={project.ownerId.avatarUrl}
              alt={project.ownerId.name}
              className="w-5 h-5 rounded-full object-cover border border-white/20"
            />
            <span className="font-semibold text-white">{project.ownerId.name}</span>
            <a
              href={`https://github.com/${project.ownerId.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#adc6ff] hover:underline"
            >
              @{project.ownerId.githubUsername}
            </a>
            <span className="text-emerald-400 font-semibold">
              • Trust: {project.ownerId.trustScore || 100}%
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[#8c909f] font-semibold uppercase tracking-wider text-xs">About this Project</h4>
          <p className="text-[#dae2fd] text-sm leading-relaxed whitespace-pre-line bg-black/25 p-4 rounded-2xl border border-white/5">
            {project.description}
          </p>
        </div>

        {/* Skills & Roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-[#8c909f] font-semibold uppercase tracking-wider text-xs mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {project.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[#adc6ff] font-mono"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[#8c909f] font-semibold uppercase tracking-wider text-xs mb-2">Open Roles</h4>
            <div className="flex flex-wrap gap-2">
              {project.requiredRoles.length > 0 ? (
                project.requiredRoles.map((role) => (
                  <span
                    key={role}
                    className="text-xs px-3 py-1 rounded-lg bg-[#8b5cf6]/15 text-[#d0bcff] font-medium border border-[#8b5cf6]/30"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8c909f]">General collaborators welcome</span>
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[#8c909f] font-semibold uppercase tracking-wider text-xs">
            Squad Roster ({project.members.length}/{project.maxTeamSize})
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.members.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10"
              >
                <img src={member.avatarUrl} alt={member.name} className="w-5 h-5 rounded-full object-cover" />
                <span className="text-xs font-medium text-white">{member.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        {/* Actions */}
        {userId ? (
          isOwner ? (
            <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 p-5 rounded-2xl flex flex-col items-center text-center gap-3">
              <p className="text-[#adc6ff] text-sm">
                You own this project. Manage applicants, review invites, and find recommended teammates in your Dashboard.
              </p>
              <Link href="/dashboard" className="btn-primary !px-6" onClick={onClose}>
                Go to Dashboard
              </Link>
            </div>
          ) : isMember ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex flex-col items-center text-center gap-3">
              <p className="text-emerald-400 text-sm">
                You are an active teammate on this project! Launch the collaborative Team Hub now.
              </p>
              <Link href={`/workspace/${project._id}`} className="btn-primary !px-6" onClick={onClose}>
                Enter Team Workspace Hub
              </Link>
            </div>
          ) : project.status !== "Recruiting" ? (
            <div className="text-center p-5 bg-white/5 rounded-2xl border border-white/10 text-[#8c909f] text-sm">
              This project is currently not accepting new applications (Status: {project.status}).
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-4 bg-black/25 p-5 rounded-2xl border border-white/10"
            >
              <h3 className="text-base font-bold text-white">Apply to Join This Squad</h3>
              {appStatusText && (
                <div className="bg-[#3b82f6]/15 border border-[#3b82f6]/30 px-4 py-2.5 rounded-xl text-xs text-[#adc6ff]">
                  {appStatusText}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#8c909f]">Select Desired Role *</label>
                <select
                  className="github-input text-sm cursor-pointer"
                  value={appRole}
                  onChange={(e) => onRoleChange(e.target.value)}
                  required
                >
                  <option value="" className="bg-[#0b1326] text-white">-- Select a role --</option>
                  {project.requiredRoles.map((role) => (
                    <option key={role} value={role} className="bg-[#0b1326] text-white">{role}</option>
                  ))}
                  <option value="General Collaborator" className="bg-[#0b1326] text-white">General Collaborator</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#8c909f]">
                  Cover Note / What can you contribute? *
                </label>
                <textarea
                  className="github-input text-sm"
                  rows={3}
                  placeholder="Highlight your skills, repositories, and what you're excited to build..."
                  value={appCover}
                  onChange={(e) => onCoverChange(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto !px-6"
                  disabled={!appRole || !appCover.trim()}
                >
                  Submit Squad Application
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3">
            <p className="text-[#c2c6d6] text-sm">Sign in with your GitHub account to apply to this project team.</p>
            <Link href="/login" className="btn-primary !px-6" onClick={onClose}>
              Sign In with GitHub
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
