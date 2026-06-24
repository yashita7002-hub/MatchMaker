"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import TrustStars from '@/components/TrustStars';

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
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col gap-16 relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="text-center flex flex-col gap-6 items-center max-w-3xl mx-auto">
        <h1 className="font-heading text-5xl md:text-6xl font-extrabold tracking-tight">
          Find the Perfect <span className="text-gradient">Team Members</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
          Pitch project ideas, find matching candidates, collaborate on hackathons or college projects, and build a trusted developers network.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {user ? (
            <button onClick={() => setShowPitchModal(true)} className="btn-primary group">
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Pitch an Idea
            </button>
          ) : (
            <Link href="/login" className="btn-primary">
              Join Project Matchmaker
            </Link>
          )}
          <a href="#discover" className="btn-secondary">Browse Projects</a>
        </div>
      </div>

      <div id="discover" className="flex flex-col gap-8">
        {/* Filters & Search */}
        <div className="glass-panel rounded-2xl p-6 flex flex-wrap lg:flex-nowrap justify-between items-center gap-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-3 flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="Search projects, skills, descriptions..."
              className="flex-1 bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn-secondary !px-6">Search</button>
          </form>

          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-400">Category:</span>
              <select className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-10" 
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 50%', backgroundSize: '12px auto' }}
                      value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                <option value="Hackathon">Hackathon</option>
                <option value="College Project">College Project</option>
                <option value="Startup">Startup</option>
                <option value="Open Source">Open Source</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-400">Status:</span>
              <select className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-10"
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 50%', backgroundSize: '12px auto' }}
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

        {/* Project Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-indigo-400">
            <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel rounded-2xl text-center py-24 text-slate-400 flex flex-col items-center gap-4">
            <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-lg">No projects found. Try adjusting your search query or filters.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className="glass-card p-6 flex flex-col justify-between gap-5 cursor-pointer group"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {project.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-heading font-bold group-hover:text-indigo-300 transition-colors line-clamp-1">{project.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-3 mt-2">
                  {project.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.requiredSkills.slice(0, 4).map(skill => (
                        <span key={skill} className="text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                          {skill}
                        </span>
                      ))}
                      {project.requiredSkills.length > 4 && <span className="text-xs px-2 py-1 text-slate-500">+{project.requiredSkills.length - 4}</span>}
                    </div>
                  )}
                  {project.requiredRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.requiredRoles.slice(0, 3).map(role => (
                        <span key={role} className="text-xs px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 font-medium">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={project.ownerId.avatarUrl} alt={project.ownerId.name} className="w-8 h-8 rounded-full border border-white/20" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{project.ownerId.name}</span>
                      <TrustStars score={project.ownerId.trustScore} max={5} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <span className="text-xs font-bold">{project.members.length}/{project.maxTeamSize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pitch Modal */}
      {showPitchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowPitchModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-2xl font-heading font-bold text-white">Pitch a New Project Idea</h2>

            {pitchError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {pitchError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Project Title *</label>
                <input type="text" className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. AI-Powered study planner" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Description *</label>
                <textarea className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" rows={4} placeholder="Describe the problem you are solving, target users, and technology stack..." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-400">Category</label>
                  <select className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="College Project">College Project</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Startup">Startup</option>
                    <option value="Open Source">Open Source</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-400">Max Team Size *</label>
                  <input type="number" min="2" max="20" className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500" value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} required />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Required Skills (comma-separated)</label>
                <input type="text" className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500" placeholder="e.g. React, Node.js, Python" value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Required Roles (comma-separated)</label>
                <input type="text" className="bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500" placeholder="e.g. Frontend Developer, UI Designer" value={rolesStr} onChange={(e) => setRolesStr(e.target.value)} />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-3xl rounded-2xl p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedProject(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {selectedProject.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-heading font-bold text-white leading-tight">{selectedProject.title}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Created by:</span>
                <img src={selectedProject.ownerId.avatarUrl} alt={selectedProject.ownerId.name} className="w-6 h-6 rounded-full border border-white/10" />
                <span className="font-semibold text-slate-200">{selectedProject.ownerId.name}</span>
                <TrustStars score={selectedProject.ownerId.trustScore} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-slate-400 font-semibold uppercase tracking-wider text-sm">Description</h4>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line bg-white/5 p-5 rounded-xl border border-white/5">
                {selectedProject.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h4 className="text-slate-400 font-semibold uppercase tracking-wider text-sm mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.requiredSkills.map(skill => (
                    <span key={skill} className="text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-slate-400 font-semibold uppercase tracking-wider text-sm mb-3">Open Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.requiredRoles.map(role => (
                    <span key={role} className="text-sm px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 font-medium border border-purple-500/20">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-slate-400 font-semibold uppercase tracking-wider text-sm">Active Team Members ({selectedProject.members.length}/{selectedProject.maxTeamSize})</h4>
              <div className="flex flex-wrap gap-3">
                {selectedProject.members.map(member => (
                  <div key={member._id} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <img src={member.avatarUrl} alt={member.name} className="w-6 h-6 rounded-full" />
                    <span className="text-sm font-medium text-slate-200">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-white/10 my-2" />

            {/* Actions */}
            {user ? (
              user._id === selectedProject.ownerId._id ? (
                <div className="bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-xl flex flex-col items-center text-center gap-4">
                  <p className="text-indigo-200">You own this project. Go to your Dashboard to invite candidates or manage pending applications!</p>
                  <Link href="/dashboard" className="btn-primary" onClick={() => setSelectedProject(null)}>
                    Go to Dashboard
                  </Link>
                </div>
              ) : selectedProject.members.some(m => m._id === user._id) ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl flex flex-col items-center text-center gap-4">
                  <p className="text-emerald-200">You are a member of this project team! Open the collaborative workspace hub now.</p>
                  <Link href={`/workspace/${selectedProject._id}`} className="btn-primary" onClick={() => setSelectedProject(null)}>
                    Enter Team Workspace
                  </Link>
                </div>
              ) : selectedProject.status !== 'Recruiting' ? (
                <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-white/5 text-slate-400">
                  This project is no longer accepting applications (Status: {selectedProject.status}).
                </div>
              ) : (
                <form onSubmit={handleApplyToTeam} className="flex flex-col gap-5 bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-xl font-heading font-bold text-white">Apply to Join the Team</h3>
                  
                  {appStatusText && (
                    <div className="bg-slate-800/80 border border-slate-600 px-4 py-3 rounded-xl text-sm text-indigo-300">
                      {appStatusText}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-400">Select Target Role *</label>
                    <select className="bg-slate-900/80 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500" value={appRole} onChange={(e) => setAppRole(e.target.value)} required>
                      <option value="">-- Select a role --</option>
                      {selectedProject.requiredRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                      <option value="General Collaborator">General Collaborator</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-400">Cover Letter / Why do you want to join? *</label>
                    <textarea className="bg-slate-900/80 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500" rows={3} placeholder="Describe your skills, what you can contribute, and why you are interested..." value={appCover} onChange={(e) => setAppCover(e.target.value)} required />
                  </div>

                  <div className="flex justify-end gap-3 mt-2">
                    <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!appRole || !appCover.trim()}>
                      Submit Application
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="text-center p-8 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-4">
                <p className="text-slate-400">You must be logged in to apply to this team.</p>
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
