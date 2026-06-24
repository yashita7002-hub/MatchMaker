"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  requiredRoles: string[];
  maxTeamSize: number;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  members: Array<{
    _id: string;
    githubUsername: string;
    name: string;
    avatarUrl: string;
  }>;
  ownerId: {
    _id: string;
    githubUsername: string;
    name: string;
    avatarUrl: string;
    trustScore: number;
  };
  createdAt: string;
}

export default function Home() {
  const { user } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('College Project');
  const [skillsStr, setSkillsStr] = useState('');
  const [rolesStr, setRolesStr] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState('4');
  const [submitting, setSubmitting] = useState(false);
  const [pitchError, setPitchError] = useState('');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [appRole, setAppRole] = useState('');
  const [appCover, setAppCover] = useState('');
  const [appStatusText, setAppStatusText] = useState('');

  const [showSearch, setShowSearch] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/projects', window.location.origin);
      if (categoryFilter !== 'All') url.searchParams.set('category', categoryFilter);
      if (statusFilter !== 'All') url.searchParams.set('status', statusFilter);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !maxTeamSize) {
      setPitchError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setPitchError('');
      const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const roles = rolesStr.split(',').map(r => r.trim()).filter(Boolean);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          requiredSkills: skills,
          requiredRoles: roles,
          maxTeamSize: Number(maxTeamSize),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTitle('');
        setDescription('');
        setSkillsStr('');
        setRolesStr('');
        setMaxTeamSize('4');
        setShowPitchModal(false);
        fetchProjects(); 
      } else {
        setPitchError(data.error || 'Failed to create project.');
      }
    } catch (err) {
      setPitchError('Network error. Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !appRole) return;

    try {
      setAppStatusText('Submitting application...');
      const res = await fetch(`/api/projects/${selectedProject._id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: appRole,
          coverLetter: appCover,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAppStatusText('Application submitted successfully!');
        setAppRole('');
        setAppCover('');
        setTimeout(() => {
          setSelectedProject(null);
          setAppStatusText('');
        }, 1500);
      } else {
        setAppStatusText(`Error: ${data.error}`);
      }
    } catch (err) {
      setAppStatusText('Network error. Application failed.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recruiting': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'completed': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'archived': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col gap-20 relative">
      {/* Background Decor - GitHub themed */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#58a6ff]/8 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] bg-[#238636]/8 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="text-center flex flex-col gap-6 items-center max-w-4xl mx-auto">
        <div className="flex items-center gap-3 justify-center mb-2">
          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <h1 className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight text-white">
            Project <span className="text-[#238636]">Matchmaker</span>
          </h1>
        </div>
        <p className="text-gray-400 text-xl md:text-2xl leading-relaxed max-w-3xl">
          The GitHub-powered platform for finding teammates, collaborating on projects, and building your developer reputation.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {user ? (
            <button onClick={() => setShowPitchModal(true)} className="btn-primary group text-lg px-8 py-3">
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Pitch a Project
            </button>
          ) : (
            <Link href="/login" className="btn-primary text-lg px-8 py-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Join with GitHub
            </Link>
          )}
          <a href="#discover" onClick={() => setShowSearch(true)} className="btn-secondary text-lg px-8 py-3">Browse Projects</a>
        </div>
      </div>

      {/* Features Section */}
      <div className="flex flex-col gap-16">
        {/* GitHub Logins & Profiles */}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">GitHub-Powered Profiles</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Your GitHub identity is your developer passport. We pull your real contributions to build trust.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#58a6ff]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <h3 className="text-lg font-bold text-white">GitHub Login</h3>
              </div>
              <p className="text-gray-400 text-sm">Secure authentication using your GitHub account. No extra passwords to remember.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#238636]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Repo Showcase</h3>
              </div>
              <p className="text-gray-400 text-sm">Display your public repositories, bio, and GitHub profile details automatically.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#a371f7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Contribution Graph</h3>
              </div>
              <p className="text-gray-400 text-sm">Embed your GitHub contribution graph to prove your coding activity.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#f78166]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Status Updates</h3>
              </div>
              <p className="text-gray-400 text-sm">Set your availability: Available, Busy, Looking for Team, or Looking for Projects.</p>
            </div>
          </div>
        </div>

        {/* Managing Projects */}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Project Management</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">From idea to execution, manage your entire project lifecycle with AI-powered team matching.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#58a6ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Pitch Ideas</h3>
              </div>
              <p className="text-gray-400 text-sm">Create projects with title, description, category, required skills, roles, and team size.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#238636]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Project Status</h3>
              </div>
              <p className="text-gray-400 text-sm">Update project status: Recruiting, Active, Completed, or Archived.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#a371f7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <h3 className="text-lg font-bold text-white">AI Recommendations</h3>
              </div>
              <p className="text-gray-400 text-sm">AI analyzes GitHub profiles to recommend the best matching candidates for your team.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#f78166]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Apply to Teams</h3>
              </div>
              <p className="text-gray-400 text-sm">Browse projects and apply to teams that match your interests and skills.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#58a6ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Team Invitations</h3>
              </div>
              <p className="text-gray-400 text-sm">Send invitations to recommended users. Accept or decline from your dashboard.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#238636]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Application Review</h3>
              </div>
              <p className="text-gray-400 text-sm">Project creators can accept or reject applications from their dashboard.</p>
            </div>
          </div>
        </div>

        {/* Team Workspace */}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Team Workspace Hub</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">When your project gets 2+ members, unlock a private collaboration hub with everything you need.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#58a6ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Team Chat</h3>
              </div>
              <p className="text-gray-400 text-sm">Real-time chat with typing indicators, image sharing, and instant updates.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#238636]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Discussion Boards</h3>
              </div>
              <p className="text-gray-400 text-sm">Organize longer conversations with threaded discussions for planning and debugging.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#a371f7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Resource Vault</h3>
              </div>
              <p className="text-gray-400 text-sm">Central hub for GitHub repos, design files, presentation slides, and important links.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#f78166]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Kanban Board</h3>
              </div>
              <p className="text-gray-400 text-sm">Built-in drag-and-drop task management with To-Do, In Progress, Review, and Done columns.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#58a6ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Expense Tracking</h3>
              </div>
              <p className="text-gray-400 text-sm">Track AI API costs, AWS bills, hosting, domains, and other project expenses.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#238636]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Auto Hub Creation</h3>
              </div>
              <p className="text-gray-400 text-sm">Private workspace automatically created when project has 2+ accepted members.</p>
            </div>
          </div>
        </div>

        {/* Ratings and Trust */}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ratings & Trust System</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Build your developer reputation through peer reviews and trust scores.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#f78166]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Peer Reviews</h3>
              </div>
              <p className="text-gray-400 text-sm">Rate teammates on Communication, Technical Skills, Reliability, and Teamwork.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#238636]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Trust Score</h3>
              </div>
              <p className="text-gray-400 text-sm">Overall reputation score based on past projects and teammate reviews.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#58a6ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Team History</h3>
              </div>
              <p className="text-gray-400 text-sm">View past collaborations and project outcomes for each team member.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#a371f7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="7"/>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Review Trigger</h3>
              </div>
              <p className="text-gray-400 text-sm">Reviews unlock when project is marked as Completed.</p>
            </div>
          </div>
        </div>

        {/* Security & Optional Features */}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Security & Advanced Features</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Enterprise-grade security with optional productivity boosters.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#238636]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Role-Based Access</h3>
              </div>
              <p className="text-gray-400 text-sm">Visitors, Members, and Project Owners have appropriate permissions.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#58a6ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Auto GitHub Setup</h3>
              </div>
              <p className="text-gray-400 text-sm">Auto-create shared GitHub repo when project goes from Recruiting to Active.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#a371f7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Analytics Dashboard</h3>
              </div>
              <p className="text-gray-400 text-sm">Team activity, task completion, contribution stats, and expense trends.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#f78166]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Smart Notifications</h3>
              </div>
              <p className="text-gray-400 text-sm">Alerts for invitations, applications, chat messages, tasks, and deadlines.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#58a6ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Private Hubs</h3>
              </div>
              <p className="text-gray-400 text-sm">Team workspaces are private. Only team members can access their hub.</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#8b949e] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-[#238636]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <h3 className="text-lg font-bold text-white">Project Management</h3>
              </div>
              <p className="text-gray-400 text-sm">Owners can edit/delete projects, manage teams, and update status.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#58a6ff] via-[#238636] to-[#a371f7]" />
        <div className="relative z-10 flex flex-col gap-6 items-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Build Your Dream Team?</h2>
          <p className="text-gray-400 text-lg">
            Join thousands of developers who are already collaborating on projects, building their reputation, and shipping amazing products.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {user ? (
              <button onClick={() => setShowPitchModal(true)} className="btn-primary group text-lg px-8 py-3">
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Start Your Project
              </button>
            ) : (
              <Link href="/login" className="btn-primary text-lg px-8 py-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Join with GitHub
              </Link>
            )}
            <a href="#discover" onClick={() => setShowSearch(true)} className="btn-secondary text-lg px-8 py-3">Explore Projects</a>
          </div>
        </div>
      </div>

      <div id="discover" className="flex flex-col gap-8">
        {/* Filters & Search */}
        {showSearch && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 flex flex-wrap lg:flex-nowrap justify-between items-center gap-6 animate-in fade-in duration-300 slide-in-from-top-4 shadow-lg">
            <form onSubmit={handleSearchSubmit} className="flex gap-3 flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Search projects, skills, descriptions..."
                className="github-input flex-1 px-4 py-2.5 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn-secondary !px-6">Search</button>
            </form>

            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">Category:</span>
                <select className="github-input px-4 py-2.5 rounded-xl cursor-pointer appearance-none pr-10" 
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b949e%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 50%', backgroundSize: '12px auto' }}
                        value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="All">All Categories</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="College Project">College Project</option>
                  <option value="Startup">Startup</option>
                  <option value="Open Source">Open Source</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">Status:</span>
                <select className="github-input px-4 py-2.5 rounded-xl cursor-pointer appearance-none pr-10"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b949e%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 50%', backgroundSize: '12px auto' }}
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Recruiting">Recruiting</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Project Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-[#58a6ff]">
            <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl text-center py-24 text-gray-400 flex flex-col items-center gap-4 shadow-lg">
            <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg">No projects found. Try adjusting your search query or filters.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col justify-between gap-5 cursor-pointer group hover:border-[#8b949e] transition-all hover:shadow-lg"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <span className="github-badge px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    {project.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#58a6ff] transition-colors line-clamp-1">{project.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-3 mt-2">
                  {project.requiredSkills.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                      {project.requiredSkills.slice(0, 4).map(skill => (
                        <span key={skill} className="text-[11px] px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-gray-300 hover:border-[#8b949e] transition-colors">
                          {skill}
                        </span>
                      ))}
                      {project.requiredSkills.length > 4 && <span className="text-[11px] px-2 py-0.5 text-gray-500">+{project.requiredSkills.length - 4}</span>}
                    </div>
                  )}
                  {project.requiredRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.requiredRoles.slice(0, 3).map(role => (
                        <span key={role} className="text-[11px] px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#d2a8ff] font-medium hover:bg-[#8b5cf6]/20 transition-colors">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-[#30363d] my-1" />

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={project.ownerId.avatarUrl} alt={project.ownerId.name} className="w-7 h-7 rounded-full border border-[#30363d]" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-300">{project.ownerId.name}</span>
                      <a href={`https://github.com/${project.ownerId.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#58a6ff] hover:text-[#79c0ff] hover:underline transition-colors">@{project.ownerId.githubUsername}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] hover:border-[#8b949e] transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <span className="text-[11px] font-bold">{project.members.length}/{project.maxTeamSize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pitch Modal */}
      {showPitchModal && (
        <div className="fixed inset-0 bg-[#0d1117]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-2xl rounded-xl p-6 md:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setShowPitchModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-xl md:text-2xl font-bold text-white">Pitch a New Project Idea</h2>

            {pitchError && (
              <div className="bg-[#f85149]/10 border border-[#f85149]/30 text-[#ff7b72] px-4 py-3 rounded-lg text-sm">
                {pitchError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-300">Project Title *</label>
                <input type="text" className="github-input" placeholder="e.g. AI-Powered study planner" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-300">Description *</label>
                <textarea className="github-input" rows={4} placeholder="Describe the problem you are solving, target users, and technology stack..." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-300">Category</label>
                  <select className="github-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="College Project">College Project</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Startup">Startup</option>
                    <option value="Open Source">Open Source</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-300">Max Team Size *</label>
                  <input type="number" min="2" max="20" className="github-input" value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-300">Required Skills (comma-separated)</label>
                <input type="text" className="github-input" placeholder="e.g. React, Node.js, Python" value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-300">Required Roles (comma-separated)</label>
                <input type="text" className="github-input" placeholder="e.g. Frontend Developer, UI Designer" value={rolesStr} onChange={(e) => setRolesStr(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowPitchModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Submit Pitch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-[#0d1117]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-3xl rounded-xl p-6 md:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setSelectedProject(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="github-badge px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                {selectedProject.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{selectedProject.title}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Created by:</span>
                <img src={selectedProject.ownerId.avatarUrl} alt={selectedProject.ownerId.name} className="w-5 h-5 rounded-full border border-[#30363d]" />
                <span className="font-semibold text-gray-300">{selectedProject.ownerId.name}</span>
                <a href={`https://github.com/${selectedProject.ownerId.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline transition-colors">@{selectedProject.ownerId.githubUsername}</a>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-2">
              <h4 className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Description</h4>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-[#0d1117] p-4 rounded-lg border border-[#30363d] hover:border-[#8b949e] transition-colors">
                {selectedProject.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.requiredSkills.map(skill => (
                    <span key={skill} className="text-xs px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-gray-300 hover:border-[#8b949e] transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Open Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.requiredRoles.map(role => (
                    <span key={role} className="text-xs px-2.5 py-1 rounded bg-[#8b5cf6]/10 text-[#d2a8ff] font-medium border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 transition-colors">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <h4 className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Active Team Members ({selectedProject.members.length}/{selectedProject.maxTeamSize})</h4>
              <div className="flex flex-wrap gap-3">
                {selectedProject.members.map(member => (
                  <div key={member._id} className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-full border border-[#30363d] hover:border-[#8b949e] transition-colors">
                    <img src={member.avatarUrl} alt={member.name} className="w-5 h-5 rounded-full" />
                    <span className="text-xs font-medium text-gray-300">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-[#30363d] my-2" />

            {/* Actions */}
            {user ? (
              user._id === selectedProject.ownerId._id ? (
                <div className="bg-[#1f6feb]/10 border border-[#1f6feb]/30 p-5 rounded-lg flex flex-col items-center text-center gap-3">
                  <p className="text-[#58a6ff] text-sm">You own this project. Go to your Dashboard to invite candidates or manage pending applications!</p>
                  <Link href="/dashboard" className="btn-primary" onClick={() => setSelectedProject(null)}>
                    Go to Dashboard
                  </Link>
                </div>
              ) : selectedProject.members.some(m => m._id === user._id) ? (
                <div className="bg-[#2ea043]/10 border border-[#2ea043]/30 p-5 rounded-lg flex flex-col items-center text-center gap-3">
                  <p className="text-[#2ea043] text-sm">You are a member of this project team! Open the collaborative workspace hub now.</p>
                  <Link href={`/workspace/${selectedProject._id}`} className="btn-primary" onClick={() => setSelectedProject(null)}>
                    Enter Team Workspace
                  </Link>
                </div>
              ) : selectedProject.status !== 'Recruiting' ? (
                <div className="text-center p-5 bg-[#0d1117] rounded-lg border border-[#30363d] text-gray-400 text-sm">
                  This project is no longer accepting applications (Status: {selectedProject.status}).
                </div>
              ) : (
                <form onSubmit={handleApplyToTeam} className="flex flex-col gap-4 bg-[#0d1117] p-5 rounded-lg border border-[#30363d]">
                  <h3 className="text-lg font-bold text-white">Apply to Join the Team</h3>
                  
                  {appStatusText && (
                    <div className="bg-[#1f6feb]/10 border border-[#1f6feb]/30 px-3 py-2 rounded text-sm text-[#58a6ff]">
                      {appStatusText}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">Select Target Role *</label>
                    <select className="github-input" value={appRole} onChange={(e) => setAppRole(e.target.value)} required>
                      <option value="">-- Select a role --</option>
                      {selectedProject.requiredRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                      <option value="General Collaborator">General Collaborator</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">Cover Letter / Why do you want to join? *</label>
                    <textarea className="github-input" rows={3} placeholder="Describe your skills, what you can contribute, and why you are interested..." value={appCover} onChange={(e) => setAppCover(e.target.value)} required />
                  </div>

                  <div className="flex justify-end mt-1">
                    <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!appRole || !appCover.trim()}>
                      Submit Application
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="text-center p-6 bg-[#0d1117] border border-[#30363d] rounded-lg flex flex-col items-center gap-3">
                <p className="text-gray-400 text-sm">You must be logged in to apply to this team.</p>
                <Link href="/login" className="btn-primary" onClick={() => setSelectedProject(null)}>
                  Login with GitHub
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
