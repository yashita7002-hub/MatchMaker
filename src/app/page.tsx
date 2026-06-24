"use client";
import React, { useState, useEffect, useRef } from 'react';
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

const CATEGORY_TABS = [
  { label: 'All', value: 'All', icon: '✦' },
  { label: 'Hackathon', value: 'Hackathon', icon: '⚡' },
  { label: 'College', value: 'College Project', icon: '🎓' },
  { label: 'Open Source', value: 'Open Source', icon: '🌐' },
  { label: 'Startup', value: 'Startup', icon: '🚀' },
];

const STATUS_TABS = [
  { label: 'All', value: 'All' },
  { label: 'Recruiting', value: 'Recruiting' },
  { label: 'Active', value: 'Active' },
  { label: 'Archived', value: 'Archived' },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Hackathon Teams',
    description: 'Find teammates for 24–48 hour sprints. Filter by skill, time zone, and domain.',
    color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/20',
    badge: 'text-yellow-400',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    title: 'College Projects',
    description: 'Partner with students on semester projects, capstone work, and research.',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    badge: 'text-blue-400',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'Open Source',
    description: 'Contribute to community projects, build your GitHub profile, and grow together.',
    color: 'from-green-500/20 to-emerald-500/10 border-green-500/20',
    badge: 'text-emerald-400',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'Startups',
    description: 'Join early-stage teams. Equity-based, mission-driven, and fast-moving.',
    color: 'from-purple-500/20 to-violet-500/10 border-purple-500/20',
    badge: 'text-purple-400',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Sign in with GitHub',
    description: 'Your GitHub profile is your identity. We pull your repos, skills, and contribution history.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Pitch or Browse',
    description: 'Post your project idea with required roles and skills, or browse existing ones to apply.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Collaborate & Build',
    description: 'Use the team workspace to chat, track tasks, share expenses, and ship together.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, recruiting: 0, members: 0 });
  const [statsAnimated, setStatsAnimated] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

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

  const feedRef = useRef<HTMLDivElement>(null);

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
        // Compute stats from live data
        const all: Project[] = data.projects;
        const recruiting = all.filter((p: Project) => p.status === 'Recruiting').length;
        const totalMembers = all.reduce((sum: number, p: Project) => sum + p.members.length, 0);
        setStats({ total: all.length, recruiting, members: totalMembers });
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

  // Stats count-up animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsAnimated(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

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
    } catch {
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
        body: JSON.stringify({ role: appRole, coverLetter: appCover }),
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
    } catch {
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

  const getStatusDot = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recruiting': return 'bg-blue-400';
      case 'active': return 'bg-emerald-400';
      case 'completed': return 'bg-purple-400';
      case 'archived': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const scrollToFeed = () => {
    feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex-1 w-full flex flex-col">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#238636]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-[#58a6ff]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#8b5cf6]/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center flex flex-col items-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#238636]/10 border border-[#238636]/30 text-[#3fb950] text-xs font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            Open for collaboration
          </div>

          {/* Headline */}
          <h1 className="font-extrabold text-5xl md:text-7xl tracking-tight text-white leading-[1.05] max-w-4xl">
            Find your perfect{' '}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] via-[#3fb950] to-[#8b5cf6]">
                project team
              </span>
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl">
            Pitch ideas, recruit collaborators, and ship together — whether it's a hackathon, college project, open source library, or your next startup.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {user ? (
              <button
                onClick={() => setShowPitchModal(true)}
                className="btn-primary group !px-6 !py-3 !text-base shadow-lg shadow-[#238636]/20"
              >
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Pitch an Idea
              </button>
            ) : (
              <Link
                href="/login"
                className="btn-primary group !px-6 !py-3 !text-base shadow-lg shadow-[#238636]/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Join with GitHub
              </Link>
            )}
            <button
              onClick={scrollToFeed}
              className="btn-secondary !px-6 !py-3 !text-base"
            >
              Browse Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Social proof strip */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#3fb950]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              GitHub OAuth — no passwords
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#58a6ff]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Trust-score system
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#d2a8ff]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Real-time team workspace
            </span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section ref={statsRef} className="w-full border-y border-[#30363d] bg-[#161b22]/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'Projects Listed', value: stats.total, suffix: '+', color: 'text-white' },
            { label: 'Recruiting Now', value: stats.recruiting, suffix: '', color: 'text-blue-400' },
            { label: 'Active Members', value: stats.members, suffix: '+', color: 'text-emerald-400' },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className={`text-3xl md:text-4xl font-extrabold tabular-nums ${color}`}>
                {statsAnimated ? value : 0}{suffix}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      

      

      {/* ── PROJECT FEED ──────────────────────────────────────── */}
      <section ref={feedRef} id="discover" className="w-full max-w-7xl mx-auto px-6 py-16 flex flex-col gap-8">
        {/* Feed Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Open Projects</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto sm:min-w-[280px]">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search skills, projects..."
                  className="github-input w-full pl-9 pr-4 py-2 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-secondary !px-4 !py-2 text-sm">Go</button>
            </form>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 flex-wrap">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setCategoryFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  categoryFilter === tab.value
                    ? 'bg-[#238636] text-white border border-[#2ea043]'
                    : 'bg-[#161b22] text-gray-400 border border-[#30363d] hover:border-[#8b949e] hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status sub-tabs */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
                  statusFilter === tab.value
                    ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40'
                    : 'bg-transparent text-gray-500 border border-[#30363d] hover:text-gray-300'
                }`}
              >
                {tab.value !== 'All' && (
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(tab.value)}`} />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-24 text-[#58a6ff]">
            <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl text-center py-24 text-gray-400 flex flex-col items-center gap-4 shadow-lg">
            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-lg font-semibold text-white mb-1">No projects found</p>
              <p className="text-sm">Try adjusting your filters or search query.</p>
            </div>
            <button
              onClick={() => { setCategoryFilter('All'); setStatusFilter('All'); setSearchQuery(''); }}
              className="btn-secondary !text-sm !px-5 !py-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col justify-between gap-4 cursor-pointer group hover:border-[#58a6ff]/40 hover:shadow-lg hover:shadow-[#58a6ff]/5 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <span className="github-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {project.category}
                  </span>
                  <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(project.status)} ${project.status === 'Recruiting' ? 'animate-pulse' : ''}`} />
                    {project.status}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-[#58a6ff] transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{project.description}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                  {project.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.requiredSkills.slice(0, 4).map(skill => (
                        <span key={skill} className="text-[10px] px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-gray-300">
                          {skill}
                        </span>
                      ))}
                      {project.requiredSkills.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 text-gray-500">+{project.requiredSkills.length - 4}</span>
                      )}
                    </div>
                  )}
                  {project.requiredRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.requiredRoles.slice(0, 3).map(role => (
                        <span key={role} className="text-[10px] px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#d2a8ff] font-medium">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-[#30363d]" />

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img
                      src={project.ownerId.avatarUrl}
                      alt={project.ownerId.name}
                      className="w-6 h-6 rounded-full border border-[#30363d]"
                    />
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-semibold text-gray-300 line-clamp-1">{project.ownerId.name}</span>
                      <a
                        href={`https://github.com/${project.ownerId.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-[#58a6ff] hover:underline"
                      >
                        @{project.ownerId.githubUsername}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <span className="text-[10px] font-bold">{project.members.length}/{project.maxTeamSize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}







        {/* ── FEATURE CARDS ─────────────────────────────────────── */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Every type of collaboration
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            From 48-hour hackathons to long-running open source projects — find your fit.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <button
              key={f.title}
              onClick={() => {
                setCategoryFilter(f.title === 'College' ? 'College Project' : f.title === 'All' ? 'All' : f.title === 'Hackathon Teams' ? 'Hackathon' : f.title === 'Open Source' ? 'Open Source' : 'Startup');
                scrollToFeed();
              }}
              className={`group text-left bg-gradient-to-br ${f.color} border rounded-xl p-5 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
            >
              <div className={`${f.badge} w-10 h-10 rounded-lg bg-[#0d1117]/60 flex items-center justify-center`}>
                {f.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-base mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </div>
              <span className={`text-xs font-semibold ${f.badge} flex items-center gap-1 mt-auto`}>
                Browse →
              </span>
            </button>
          ))}
        </div>
      </section>

        {/* Pitch CTA at bottom of feed */}
        {!loading && projects.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-4 py-10 border-t border-[#30363d]">
            <p className="text-gray-400 text-sm">Don't see what you're looking for?</p>
            {user ? (
              <button onClick={() => setShowPitchModal(true)} className="btn-primary !px-6 !py-2.5 shadow-lg shadow-[#238636]/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Pitch your own idea
              </button>
            ) : (
              <Link href="/login" className="btn-primary !px-6 !py-2.5 shadow-lg shadow-[#238636]/20">
                Sign in to pitch your idea
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── PITCH MODAL ───────────────────────────────────────── */}
      {showPitchModal && (
        <div className="fixed inset-0 bg-[#0d1117]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-2xl rounded-xl p-6 md:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setShowPitchModal(false)}
              className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#30363d]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Pitch a New Project Idea</h2>
              <p className="text-gray-500 text-sm mt-1">Tell the community what you're building and who you need.</p>
            </div>

            {pitchError && (
              <div className="bg-[#f85149]/10 border border-[#f85149]/30 text-[#ff7b72] px-4 py-3 rounded-lg text-sm">
                {pitchError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-300">Project Title *</label>
                <input type="text" className="github-input" placeholder="e.g. AI-Powered Study Planner" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-300">Description *</label>
                <textarea className="github-input" rows={4} placeholder="Describe the problem you're solving, target users, and tech stack..." value={description} onChange={(e) => setDescription(e.target.value)} required />
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
                <label className="text-sm font-semibold text-gray-300">Required Skills <span className="text-gray-500 font-normal">(comma-separated)</span></label>
                <input type="text" className="github-input" placeholder="e.g. React, Node.js, Python" value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-300">Required Roles <span className="text-gray-500 font-normal">(comma-separated)</span></label>
                <input type="text" className="github-input" placeholder="e.g. Frontend Developer, UI Designer" value={rolesStr} onChange={(e) => setRolesStr(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#30363d]">
                <button type="button" onClick={() => setShowPitchModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Submit Pitch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PROJECT DETAIL MODAL ──────────────────────────────── */}
      {selectedProject && (
        <div className="fixed inset-0 bg-[#0d1117]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-3xl rounded-xl p-6 md:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#30363d]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="github-badge px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                {selectedProject.category}
              </span>
              <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedProject.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(selectedProject.status)} ${selectedProject.status === 'Recruiting' ? 'animate-pulse' : ''}`} />
                {selectedProject.status}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{selectedProject.title}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Created by:</span>
                <img src={selectedProject.ownerId.avatarUrl} alt={selectedProject.ownerId.name} className="w-5 h-5 rounded-full border border-[#30363d]" />
                <span className="font-semibold text-gray-300">{selectedProject.ownerId.name}</span>
                <a href={`https://github.com/${selectedProject.ownerId.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline transition-colors">
                  @{selectedProject.ownerId.githubUsername}
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Description</h4>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-[#0d1117] p-4 rounded-lg border border-[#30363d]">
                {selectedProject.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.requiredSkills.map(skill => (
                    <span key={skill} className="text-xs px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-gray-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Open Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.requiredRoles.map(role => (
                    <span key={role} className="text-xs px-2.5 py-1 rounded bg-[#8b5cf6]/10 text-[#d2a8ff] font-medium border border-[#8b5cf6]/30">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-gray-400 font-semibold uppercase tracking-wider text-xs">
                Active Team Members ({selectedProject.members.length}/{selectedProject.maxTeamSize})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedProject.members.map(member => (
                  <div key={member._id} className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-full border border-[#30363d]">
                    <img src={member.avatarUrl} alt={member.name} className="w-5 h-5 rounded-full" />
                    <span className="text-xs font-medium text-gray-300">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-[#30363d]" />

            {/* Actions */}
            {user ? (
              user._id === selectedProject.ownerId._id ? (
                <div className="bg-[#1f6feb]/10 border border-[#1f6feb]/30 p-5 rounded-lg flex flex-col items-center text-center gap-3">
                  <p className="text-[#58a6ff] text-sm">You own this project. Go to your Dashboard to manage applications and invite candidates!</p>
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
                <p className="text-gray-400 text-sm">You must be signed in to apply to this project.</p>
                <Link href="/login" className="btn-primary" onClick={() => setSelectedProject(null)}>
                  Sign in with GitHub
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
