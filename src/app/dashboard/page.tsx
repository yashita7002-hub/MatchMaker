"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import TrustStars from '@/components/TrustStars';

interface User {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  trustScore: number;
}

interface Project {
  _id: string;
  title: string;
  ownerId: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  requiredSkills: string[];
  requiredRoles: string[];
  members: User[];
  maxTeamSize: number;
}

interface Application {
  _id: string;
  projectId: { _id: string; title: string; ownerId: string; status: string };
  userId: { _id: string; githubUsername: string; name: string; avatarUrl: string; trustScore: number; bio: string; skills: string[] };
  role: string;
  coverLetter: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}

interface Invitation {
  _id: string;
  projectId: { _id: string; title: string; ownerId: User; status: string; requiredSkills?: string[] };
  userId: User;
  role: string;
  status: 'Pending' | 'Accepted' | 'Declined';
}

interface CandidateRecommendation {
  candidate: {
    _id: string;
    githubUsername: string;
    name: string;
    avatarUrl: string;
    bio: string;
    status: string;
    skills: string[];
    roles: string[];
    trustScore: number;
  };
  matchScore: number;
  reasons: string[];
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'recruiting': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'completed': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'archived': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'accepted': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'rejected': case 'declined': return 'bg-red-500/10 text-red-400 border-red-500/30';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

export default function Dashboard() {
  const { user, loading: authLoading } = useApp();
  const [data, setData] = useState<{
    ownedProjects: Project[];
    incomingApplications: Application[];
    outgoingInvitations: Invitation[];
    myApplications: any[];
    myInvitations: any[];
    activeTeams: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [recommendationsProject, setRecommendationsProject] = useState<Project | null>(null);
  const [recommendations, setRecommendations] = useState<CandidateRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [inviteRoleMap, setInviteRoleMap] = useState<Record<string, string>>({});
  const [inviteStatusMap, setInviteStatusMap] = useState<Record<string, string>>({});

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleApplicationAction = async (appId: string, status: 'Accepted' | 'Rejected') => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Failed to update application:', err);
    }
  };

  const handleInvitationAction = async (inviteId: string, status: 'Accepted' | 'Declined') => {
    try {
      const res = await fetch(`/api/invitations/${inviteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Failed to update invitation:', err);
    }
  };

  const handleOpenRecommendations = async (project: Project) => {
    setRecommendationsProject(project);
    setRecommendations([]);
    setInviteStatusMap({});
    try {
      setLoadingRecs(true);
      const res = await fetch(`/api/projects/${project._id}/recommendations`);
      if (res.ok) {
        const json = await res.json();
        setRecommendations(json.recommendations);
        const initialRoles: Record<string, string> = {};
        json.recommendations.forEach((rec: CandidateRecommendation) => {
          initialRoles[rec.candidate._id] = project.requiredRoles[0] || 'General Collaborator';
        });
        setInviteRoleMap(initialRoles);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleSendInvitation = async (candidateId: string) => {
    if (!recommendationsProject) return;
    const role = inviteRoleMap[candidateId] || 'General Collaborator';
    setInviteStatusMap(prev => ({ ...prev, [candidateId]: 'sending' }));
    try {
      const res = await fetch(`/api/projects/${recommendationsProject._id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: candidateId, role }),
      });
      const json = await res.json();
      if (res.ok) {
        setInviteStatusMap(prev => ({ ...prev, [candidateId]: 'sent' }));
        fetchDashboardData();
      } else {
        setInviteStatusMap(prev => ({ ...prev, [candidateId]: `error: ${json.error}` }));
      }
    } catch (err) {
      setInviteStatusMap(prev => ({ ...prev, [candidateId]: 'failed' }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-[#58a6ff]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-400 text-sm">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-md p-10 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#f85149]/10 flex items-center justify-center border border-[#f85149]/30">
            <svg className="w-8 h-8 text-[#ff7b72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-400">You must log in to view your dashboard.</p>
          <Link href="/login" className="btn-primary w-full justify-center">Login with GitHub</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10 relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-[-5%] w-[30%] h-[40%] bg-[#58a6ff]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full border-2 border-[#30363d]" />
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome back, <span className="text-[#58a6ff]">{user.name.split(' ')[0]}</span></h1>
            <p className="text-gray-400 mt-1">Manage your projects, applications, and team workspaces.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-8">
          {/* My Pitched Projects */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1f6feb]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">My Pitched Projects</h2>
            </div>

            {data?.ownedProjects.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-400">You have not pitched any project ideas yet.</p>
                <Link href="/" className="btn-primary !py-2 !px-5 !text-sm">Pitch an Idea</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {data?.ownedProjects.map(project => {
                  const projectApps = data.incomingApplications.filter(a => a.projectId._id === project._id);
                  const projectInvites = data.outgoingInvitations.filter(i => i.projectId._id === project._id);
                  return (
                    <div key={project._id} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 flex flex-col gap-5">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-lg font-bold text-white">{project.title}</h3>
                          <span className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => handleOpenRecommendations(project)} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1.5">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" /><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.73 9.94" />
                            </svg>
                            AI Recommendations
                          </button>
                          {project.members.length >= 2 && (
                            <Link href={`/workspace/${project._id}`} className="btn-primary !py-1.5 !px-3 !text-xs">
                              Enter Workspace
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span>Members: <strong className="text-white">{project.members.length}/{project.maxTeamSize}</strong></span>
                        <span>Pending Applications: <strong className="text-[#d2a8ff]">{projectApps.length}</strong></span>
                        <span>Invites Sent: <strong className="text-[#58a6ff]">{projectInvites.length}</strong></span>
                      </div>

                      {projectApps.length > 0 && (
                        <div className="border border-dashed border-[#30363d] rounded-xl p-4 flex flex-col gap-4">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Applications</h4>
                          {projectApps.map(app => (
                            <div key={app._id} className="flex flex-wrap gap-4 justify-between items-start bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
                              <div className="flex gap-3 items-center">
                                <img src={app.userId.avatarUrl} alt={app.userId.name} className="w-10 h-10 rounded-full border border-[#30363d]" />
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm">{app.userId.name}</span>
                                    <TrustStars score={app.userId.trustScore} />
                                  </div>
                                  <span className="text-xs text-gray-500">Applied for: <span className="text-[#58a6ff] font-medium">{app.role}</span></span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleApplicationAction(app._id, 'Accepted')} className="px-3 py-1.5 rounded-lg bg-[#2ea043]/10 border border-[#2ea043]/30 text-[#2ea043] text-xs font-semibold hover:bg-[#2ea043]/20 transition-colors">
                                  Accept
                                </button>
                                <button onClick={() => handleApplicationAction(app._id, 'Rejected')} className="px-3 py-1.5 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#ff7b72] text-xs font-semibold hover:bg-[#f85149]/20 transition-colors">
                                  Reject
                                </button>
                              </div>
                              <div className="w-full text-xs text-gray-400 italic bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
                                "{app.coverLetter}"
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Teams / Workspaces */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2ea043]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2ea043]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">My Active Team Workspaces</h2>
            </div>

            {data?.activeTeams.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">You are not currently on any other project team. Apply to projects to collaborate!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {data?.activeTeams.map(project => (
                  <div key={project._id} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 flex justify-between items-center flex-wrap gap-4 hover:border-[#8b949e] transition-colors">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-bold text-white">{project.title}</h3>
                      <p className="text-xs text-gray-500">Owner: {project.ownerId.name} · {project.members.length} teammates</p>
                    </div>
                    <Link href={`/workspace/${project._id}`} className="btn-primary !py-1.5 !px-3 !text-xs">
                      Enter Workspace
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-8">
          {/* Team Invitations */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#d2a8ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Team Invitations</h3>
              {data?.myInvitations.length ? <span className="ml-auto px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 text-[#d2a8ff] text-xs font-bold">{data.myInvitations.length}</span> : null}
            </div>

            {data?.myInvitations.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No pending team invitations received.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data?.myInvitations.map(invite => (
                  <div key={invite._id} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex flex-col gap-3">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{invite.projectId.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Invited by: <span className="text-gray-300">{invite.projectId.ownerId.name}</span></p>
                      <p className="text-xs text-[#58a6ff] font-semibold mt-1">Role offered: {invite.role}</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => handleInvitationAction(invite._id, 'Accepted')} className="flex-1 py-1.5 rounded bg-[#2ea043]/10 border border-[#2ea043]/30 text-[#2ea043] text-[11px] font-semibold hover:bg-[#2ea043]/20 transition-colors">
                        Accept
                      </button>
                      <button onClick={() => handleInvitationAction(invite._id, 'Declined')} className="flex-1 py-1.5 rounded bg-[#f85149]/10 border border-[#f85149]/30 text-[#ff7b72] text-[11px] font-semibold hover:bg-[#f85149]/20 transition-colors">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Applications */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">My Applications</h3>
            </div>

            {data?.myApplications.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">You have not applied to any project teams yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data?.myApplications.map(app => (
                  <div key={app._id} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex justify-between items-center gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{app.projectId.title}</h4>
                      <span className="text-[11px] text-gray-500">Role: {app.role}</span>
                    </div>
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendations Modal */}
      {recommendationsProject && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-4xl rounded-2xl p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setRecommendationsProject(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div>
              <span className="text-[11px] font-bold text-[#58a6ff] uppercase tracking-widest">AI Candidate Matchmaker</span>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                Recommendations for: <span className="text-[#2ea043]">{recommendationsProject.title}</span>
              </h2>
            </div>

            {loadingRecs ? (
              <div className="flex flex-col items-center gap-4 py-16 text-[#58a6ff]">
                <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-gray-400">Analyzing profiles, repository languages, and ratings...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-center py-12 text-gray-400">No matching candidate profiles found in the database.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {recommendations.slice(0, 5).map(rec => {
                  const status = inviteStatusMap[rec.candidate._id] || 'idle';
                  return (
                    <div key={rec.candidate._id} className="flex flex-wrap lg:flex-nowrap gap-6 bg-[#0d1117] border border-[#30363d] rounded-xl p-6">
                      {/* Candidate Info */}
                      <div className="flex gap-4 flex-1 min-w-[280px]">
                        <img src={rec.candidate.avatarUrl} alt={rec.candidate.name} className="w-12 h-12 rounded-full border border-[#30363d] flex-shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-white">{rec.candidate.name}</span>
                            <span className="text-gray-500 text-[11px]">@{rec.candidate.githubUsername}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(rec.candidate.status)}`}>
                              {rec.candidate.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{rec.candidate.bio}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {rec.candidate.skills.slice(0, 5).map(skill => (
                              <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-gray-300">
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 bg-[#161b22] border-l-2 border-[#58a6ff] pl-3 py-2 rounded-r-lg flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-[#58a6ff]">Match Reasons:</span>
                            {rec.reasons.map((reason, idx) => (
                              <span key={idx} className="text-[11px] text-gray-400 flex items-center gap-1.5">
                                <span className="text-[#2ea043]">✓</span> {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2.5 w-full lg:w-48 items-stretch justify-center">
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-[#2ea043]">{rec.matchScore}%</span>
                          <span className="text-[11px] text-gray-500 ml-1">match</span>
                          <div className="mt-1 flex justify-end"><TrustStars score={rec.candidate.trustScore} max={5} /></div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-gray-500">Role Offered:</label>
                          <select
                            className="bg-[#161b22] border border-[#30363d] text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-[#58a6ff]"
                            value={inviteRoleMap[rec.candidate._id] || ''}
                            onChange={(e) => setInviteRoleMap({ ...inviteRoleMap, [rec.candidate._id]: e.target.value })}
                            disabled={status === 'sent'}
                          >
                            {recommendationsProject.requiredRoles.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                            <option value="General Collaborator">General Collaborator</option>
                          </select>
                        </div>
                        <button
                          onClick={() => handleSendInvitation(rec.candidate._id)}
                          className={`btn-primary justify-center text-[11px] py-1.5 ${status === 'sent' ? '!bg-[#2ea043] !border-[#2ea043] !text-white' : ''}`}
                          disabled={status === 'sending' || status === 'sent'}
                        >
                          {status === 'sending' ? 'Sending...' : status === 'sent' ? '✓ Invite Sent!' : 'Send Invite'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
