"use client";

import React, { useState, useEffect, FormEvent } from "react";

interface PitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    project: any,
    githubSetup?: { success: boolean; repositoryUrl?: string; error?: string } | null
  ) => void;
}

export default function PitchModal({ isOpen, onClose, onSuccess }: PitchModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("College Project");
  const [skillsStr, setSkillsStr] = useState("");
  const [rolesStr, setRolesStr] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState("4");
  const [submitting, setSubmitting] = useState(false);
  const [pitchError, setPitchError] = useState("");

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!title.trim() || !description.trim()) {
      setPitchError("Please fill in the project title and description.");
      return;
    }

    const sizeNum = Number(maxTeamSize);
    if (isNaN(sizeNum) || sizeNum < 2 || sizeNum > 20) {
      setPitchError("Max team size must be between 2 and 20.");
      return;
    }

    try {
      setSubmitting(true);
      setPitchError("");

      const skills = skillsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const roles = rolesStr
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          requiredSkills: skills,
          requiredRoles: roles,
          maxTeamSize: sizeNum,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Reset form
        setTitle("");
        setDescription("");
        setSkillsStr("");
        setRolesStr("");
        setMaxTeamSize("4");
        setPitchError("");
        onSuccess(data.project, data.githubSetup || null);
        onClose();
      } else {
        setPitchError(data.error || "Failed to create project idea. Please try again.");
      }
    } catch {
      setPitchError("Network error. Failed to submit project pitch.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#020617]/85 backdrop-blur-xl z-[70] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pitch-modal-title"
    >
      <div className="glass-panel bg-[#0b1326]/95 border border-white/15 w-full max-w-2xl rounded-3xl p-6 md:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-6 right-6 text-[#8c909f] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wide uppercase">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Start Something Real</span>
          </div>
          <h2 id="pitch-modal-title" className="text-2xl font-black text-white tracking-tight mt-2">
            Pitch a New Project Idea
          </h2>
          <p className="text-[#c2c6d6] text-sm mt-1">
            Tell developers what you are creating, what skills you need, and recruit your dream squad.
          </p>
        </div>

        {pitchError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{pitchError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#adc6ff] uppercase tracking-wider">
              Project Title *
            </label>
            <input
              type="text"
              className="github-input text-sm"
              placeholder="e.g. AI-Powered Autonomous Agent IDE"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#adc6ff] uppercase tracking-wider">
              Description *
            </label>
            <textarea
              className="github-input text-sm"
              rows={4}
              placeholder="What is the mission, architecture, and who are you looking to build this with?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#adc6ff] uppercase tracking-wider">
                Category
              </label>
              <select
                className="github-input text-sm cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                <option value="College Project" className="bg-[#0b1326] text-white">
                  College Project
                </option>
                <option value="Hackathon" className="bg-[#0b1326] text-white">
                  Hackathon
                </option>
                <option value="Startup" className="bg-[#0b1326] text-white">
                  Startup
                </option>
                <option value="Open Source" className="bg-[#0b1326] text-white">
                  Open Source
                </option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#adc6ff] uppercase tracking-wider">
                Max Team Size *
              </label>
              <input
                type="number"
                min="2"
                max="20"
                className="github-input text-sm"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#adc6ff] uppercase tracking-wider">
              Required Skills <span className="text-[#8c909f] font-normal lowercase">(comma-separated)</span>
            </label>
            <input
              type="text"
              className="github-input text-sm"
              placeholder="e.g. React, Next.js, PyTorch, Docker"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#adc6ff] uppercase tracking-wider">
              Required Roles <span className="text-[#8c909f] font-normal lowercase">(comma-separated)</span>
            </label>
            <input
              type="text"
              className="github-input text-sm"
              placeholder="e.g. Frontend Engineer, ML Architect, UI/UX Designer"
              value={rolesStr}
              onChange={(e) => setRolesStr(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-2">
            <span className="text-xs text-[#8c909f]">
              Projects automatically appear in the public Feed and Team Hub.
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn-secondary !px-5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary !px-7 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating Pitch...</span>
                  </>
                ) : (
                  <span>Launch Pitch</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
