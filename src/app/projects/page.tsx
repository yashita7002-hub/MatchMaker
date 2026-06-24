"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

interface User {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  trustScore?: number;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  requiredSkills: string[];
  requiredRoles: string[];
  maxTeamSize: number;
  ownerId: User;
  members: User[];
  createdAt?: string;
  updatedAt?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Recruiting': return 'bg-[#1f6feb]/10 text-[#58a6ff] border-[#1f6feb]/30';
    case 'Active': return 'bg-[#2ea043]/10 text-[#2ea043] border-[#2ea043]/30';
    case 'Completed': return 'bg-[#30363d] text-gray-400 border-[#30363d]';
    case 'Archived': return 'bg-[#30363d] text-gray-500 border-[#30363d]';
    default: return 'bg-[#30363d] text-gray-400 border-[#30363d]';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Hackathon': return 'bg-[#d29922]/10 text-[#d29922] border-[#d29922]/30';
    case 'Startup': return 'bg-[#a371f7]/10 text-[#a371f7] border-[#a371f7]/30';
    case 'Open Source': return 'bg-[#2ea043]/10 text-[#2ea043] border-[#2ea043]/30';
    case 'Research': return 'bg-[#58a6ff]/10 text-[#58a6ff] border-[#58a6ff]/30';
    default: return 'bg-[#21262d] text-gray-300 border-[#30363d]';
  }
};

function ProjectCard({ project, role }: { project: Project; role: 'owner' | 'teammate' }) {
  const router = useRouter();
  const owner = project.ownerId;
  const allMembers = [
    owner,
    ...project.members.filter(m => m._id !== owner?._id),
  ].filter(Boolean);

  return (
    <div
      onClick={() => router.push(`/workspace/${project._id}`)}
      className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col gap-4 cursor-pointer group hover:border-[#58a6ff] transition-colors"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="text-base font-bold text-white group-hover:text-[#58a6ff] transition-colors line-clamp-1">
            {project.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(project.category)}`}>
              {project.category}
            </span>
            <span className="text-[10px] text-gray-500">
              {role === 'owner' ? 'Pitched by you' : `Led by ${owner?.name || 'Unknown'}`}
            </span>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
        {project.description || 'No description provided.'}
      </p>

      {(project.requiredSkills.length > 0 || project.requiredRoles.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {project.requiredSkills.slice(0, 4).map(skill => (
            <span key={skill} className="text-[11px] px-2 py-0.5 bg-[#0d1117] border border-[#30363d] text-gray-400 rounded-full">
              {skill}
            </span>
          ))}
          {project.requiredRoles.slice(0, 2).map(roleName => (
            <span key={roleName} className="text-[11px] px-2 py-0.5 bg-[#0d1117] border border-[#30363d]/60 text-gray-500 rounded-full italic">
              {roleName}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1 border-t border-[#30363d]/60">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Team</span>
          <span className="text-xs text-gray-500">{allMembers.length}/{project.maxTeamSize} members</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allMembers.slice(0, 6).map(member => (
            <div key={member._id} className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-full pl-0.5 pr-2.5 py-0.5">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-6 h-6 rounded-full border border-[#30363d]" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#6e40c9] text-white flex items-center justify-center text-[10px] font-bold">
                  {member.name?.substring(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] text-gray-300 truncate max-w-[80px]">{member.name}</span>
              {member._id === owner?._id && (
                <span className="text-[9px] text-[#d29922] font-semibold">Owner</span>
              )}
            </div>
          ))}
          {allMembers.length > 6 && (
            <span className="text-[11px] text-gray-500">+{allMembers.length - 6} more</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-gray-600">
          Updated {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'recently'}
        </span>
        <span className="text-xs text-[#58a6ff] font-medium group-hover:underline">Open workspace →</span>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user, loading: authLoading } = useApp();
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [teamProjects, setTeamProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/my-projects');
        if (res.ok) {
          const data = await res.json();
          setOwnedProjects(data.ownedProjects || []);
          setTeamProjects(data.teamProjects || []);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-[#58a6ff]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-400 text-sm">Loading your projects...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-md p-10 text-center flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-white">Sign in required</h2>
          <p className="text-gray-400">Log in to view your pitched and team projects.</p>
          <Link href="/login" className="btn-primary w-full justify-center">Login with GitHub</Link>
        </div>
      </div>
    );
  }

  const totalProjects = ownedProjects.length + teamProjects.length;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Projects</h1>
          <p className="text-sm text-gray-400">
            Projects you pitched and teams you belong to — {totalProjects} total
          </p>
        </div>
        <Link href="/" className="btn-primary !py-2 !px-5 !text-sm shrink-0">
          Pitch New Idea
        </Link>
      </div>

      {/* Pitched Projects */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pitched Projects</h2>
            <p className="text-xs text-gray-500">Ideas you created and are leading</p>
          </div>
        </div>

        {ownedProjects.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-10 flex flex-col items-center gap-4 text-center">
            <p className="text-gray-400 text-sm">You have not pitched any project ideas yet.</p>
            <Link href="/" className="btn-primary !py-2 !px-5 !text-sm">Pitch an Idea</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {ownedProjects.map(project => (
              <ProjectCard key={project._id} project={project} role="owner" />
            ))}
          </div>
        )}
      </section>

      {/* Team Projects */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Team Projects</h2>
            <p className="text-xs text-gray-500">Projects where you are a teammate</p>
          </div>
        </div>

        {teamProjects.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">You are not on any team project yet. Browse and apply to join one!</p>
            <Link href="/" className="inline-block mt-4 text-sm text-[#58a6ff] hover:underline">Browse projects</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {teamProjects.map(project => (
              <ProjectCard key={project._id} project={project} role="teammate" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
