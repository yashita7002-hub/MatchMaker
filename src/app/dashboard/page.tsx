"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  description: string;
  category: string;
  ownerId: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  requiredSkills: string[];
  requiredRoles: string[];
  members: User[];
  maxTeamSize: number;
  createdAt?: string;
  updatedAt?: string;
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
    case 'completed': return 'bg-[#2ea043]/10 text-[#2ea043] border-[#2ea043]/30';
    case 'archived': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    case 'pending': return 'bg-[#30363d] text-gray-400 border-[#30363d]';
    case 'accepted': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'rejected': case 'declined': return 'bg-red-500/10 text-red-400 border-red-500/30';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const memberProgress = (current: number, max: number) => Math.min(100, Math.round((current / max) * 100));

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, globalSocket } = useApp();
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

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSkillsStr, setEditSkillsStr] = useState('');
  const [editRolesStr, setEditRolesStr] = useState('');
  const [editMaxTeamSize, setEditMaxTeamSize] = useState('4');
  const [editStatus, setEditStatus] = useState<Project['status']>('Recruiting');
  const [savingProject, setSavingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const emitNotification = (notification: { userId: string; _id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string }) => {
    if (globalSocket) {
      globalSocket.emit('notify-users', { userIds: [notification.userId], notification });
    }
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description || '');
    setEditCategory(project.category || 'College Project');
    setEditSkillsStr(project.requiredSkills.join(', '));
    setEditRolesStr(project.requiredRoles.join(', '));
    setEditMaxTeamSize(String(project.maxTeamSize));
    setEditStatus(project.status);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      setSavingProject(true);
      const res = await fetch(`/api/projects/${editingProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          requiredSkills: editSkillsStr.split(',').map(s => s.trim()).filter(Boolean),
          requiredRoles: editRolesStr.split(',').map(r => r.trim()).filter(Boolean),
          maxTeamSize: Number(editMaxTeamSize),
          status: editStatus,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        json.notifications?.forEach((notif: { userId: string; _id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string }) => {
          emitNotification(notif);
        });
        setEditingProject(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (!confirm(`Delete "${projectTitle}" permanently? This cannot be undone.`)) return;
    try {
      setDeletingProjectId(projectId);
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard', { credentials: 'include' });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
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
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

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
      if (res.ok) {
        const json = await res.json();
        if (json.notification) {
          emitNotification(json.notification);
        }
        fetchDashboardData();
      }
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
      if (res.ok) {
        const json = await res.json();
        if (json.notification) {
          emitNotification(json.notification);
        }
        fetchDashboardData();
      }
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
        if (json.notification) {
          emitNotification(json.notification);
        }
        fetchDashboardData();
      } else {
        setInviteStatusMap(prev => ({ ...prev, [candidateId]: `error: ${json.error}` }));
      }
    } catch (err) {
      setInviteStatusMap(prev => ({ ...prev, [candidateId]: 'failed' }));
    }
  };

  if (authLoading) {
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
    return null;
  }

  if (loading) {
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

  const activeProjectCount = data?.ownedProjects.filter(p => p.status === 'Active' || p.status === 'Recruiting').length ?? 0;
  const matchTip = user?.skills?.length
    ? `Teams are looking for ${user.skills.slice(0, 2).join(' and ')} expertise. Keep your profile tags updated to increase visibility!`
    : 'Teams are looking for Go and Kubernetes expertise this week. Update your profile tags to increase visibility!';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-8 min-w-0">
          {/* My Pitched Projects */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white">My Pitched Projects</h2>
              </div>
              {activeProjectCount > 0 && (
                <span className="text-xs font-semibold text-[#2ea043] bg-[#2ea043]/10 border border-[#2ea043]/30 px-2.5 py-1 rounded-full">
                  {activeProjectCount} Active
                </span>
              )}
            </div>

            {data?.ownedProjects.length === 0 ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-10 flex flex-col items-center gap-4 text-center">
                <p className="text-gray-400 text-sm">You have not pitched any project ideas yet.</p>
                <Link href="/" className="btn-primary !py-2 !px-5 !text-sm">Pitch an Idea</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data?.ownedProjects.map(project => {
                  const projectApps = data.incomingApplications.filter(a => a.projectId?._id === project._id);
                  const projectInvites = data.outgoingInvitations.filter(i => i.projectId?._id === project._id);
                  const progress = memberProgress(project.members.length, project.maxTeamSize);
                  const isExpanded = expandedProjectId === project._id;

                  return (
                    <div key={project._id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-base font-bold text-[#2ea043] leading-tight">{project.title}</h3>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 min-h-[3rem]">
                        {project.description || 'No description provided.'}
                      </p>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {project.members.slice(0, 4).map(m => (
                                <img key={m._id} src={m.avatarUrl} alt={m.name} title={m.name} className="w-6 h-6 rounded-full border-2 border-[#161b22]" />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{project.members.length}/{project.maxTeamSize} members</span>
                          </div>
                          {(projectApps.length > 0 || projectInvites.length > 0) && (
                            <button
                              type="button"
                              onClick={() => setExpandedProjectId(isExpanded ? null : project._id)}
                              className="text-[10px] text-[#58a6ff] hover:underline"
                            >
                              {isExpanded ? 'Hide' : 'Manage'} ({projectApps.length + projectInvites.length})
                            </button>
                          )}
                        </div>
                        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                          <div className="h-full bg-[#2ea043] rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <Link
                        href={`/workspace/${project._id}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/50 text-white text-sm font-semibold transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Enter Workspace
                      </Link>

                      <div className="flex items-center justify-between pt-1 border-t border-[#30363d]/60">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditProject(project)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-[#21262d] rounded-md transition-colors"
                            title="Edit project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project._id, project.title)}
                            disabled={deletingProjectId === project._id}
                            className="p-2 text-gray-500 hover:text-[#ff7b72] hover:bg-[#f85149]/10 rounded-md transition-colors disabled:opacity-50"
                            title="Delete project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenRecommendations(project)}
                          className="flex items-center gap-1.5 text-xs text-[#58a6ff] hover:text-[#79c0ff] font-medium transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          AI Recommendations
                        </button>
                      </div>

                      {isExpanded && (projectApps.length > 0 || projectInvites.length > 0) && (
                        <div className="flex flex-col gap-3 pt-2 border-t border-[#30363d]/60">
                          {projectApps.map(app => (
                            <div key={app._id} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img src={app.userId.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-[#30363d]" />
                                  <span className="text-xs font-semibold text-white truncate">{app.userId.name}</span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => handleApplicationAction(app._id, 'Accepted')} className="px-2 py-1 text-[10px] rounded bg-[#2ea043]/10 border border-[#2ea043]/30 text-[#2ea043] font-semibold">Accept</button>
                                  <button onClick={() => handleApplicationAction(app._id, 'Rejected')} className="px-2 py-1 text-[10px] rounded bg-[#f85149]/10 border border-[#f85149]/30 text-[#ff7b72] font-semibold">Reject</button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {projectInvites.map(invite => (
                            <div key={invite._id} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <img src={invite.userId.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-[#30363d]" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">{invite.userId.name}</p>
                                  <p className="text-[10px] text-gray-500">Invited as {invite.role}</p>
                                </div>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(invite.status)}`}>{invite.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* My Active Team Workspaces */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">My Active Team Workspaces</h2>
            </div>

            {data?.activeTeams.length === 0 ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">You are not on any other project team yet. Apply to projects to collaborate!</p>
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl divide-y divide-[#30363d]">
                {data?.activeTeams.map((project: Project & { ownerId: User; updatedAt?: string }) => (
                  <Link
                    key={project._id}
                    href={`/workspace/${project._id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-[#21262d]/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center shrink-0 text-gray-500 group-hover:text-[#58a6ff]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{project.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{project.description || `Owner: ${(project.ownerId as User).name}`}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-gray-500">Last activity {project.updatedAt ? timeAgo(project.updatedAt) : 'recently'}</p>
                      <p className="text-[11px] text-gray-600">{project.members.length} teammates</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="flex flex-col gap-6 xl:sticky xl:top-20">
          {/* Team Invitations */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Invitations</h3>
            </div>
            <div className="p-4">
              {data?.myInvitations.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">No pending invitations.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {data?.myInvitations.map(invite => (
                    <div key={invite._id} className="flex flex-col gap-3">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        <span className="font-semibold text-white">{invite.projectId?.ownerId?.name ?? 'Someone'}</span>
                        {' '}invited you to join{' '}
                        <span className="font-semibold text-[#58a6ff]">{invite.projectId?.title ?? 'a project'}</span>
                      </p>
                      <p className="text-[11px] text-[#58a6ff]">Role: {invite.role}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleInvitationAction(invite._id, 'Accepted')} className="flex-1 py-2 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold transition-colors">
                          Accept
                        </button>
                        <button onClick={() => handleInvitationAction(invite._id, 'Declined')} className="flex-1 py-2 rounded-md bg-[#21262d] border border-[#30363d] text-gray-300 text-xs font-semibold hover:border-[#8b949e] transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* My Applications */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Applications</h3>
            </div>
            <div className="divide-y divide-[#30363d]">
              {data?.myApplications.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-6 px-4">No applications yet.</p>
              ) : (
                <>
                  {data?.myApplications.slice(0, 4).map((app: { _id: string; projectId: { title: string }; role: string; status: string; createdAt: string }) => (
                    <div key={app._id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{app.projectId?.title ?? 'Unknown project'}</p>
                        <p className="text-[11px] text-gray-500">Applied {app.createdAt ? timeAgo(app.createdAt) : 'recently'}</p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusColor(app.status)}`}>
                        {app.status === 'Pending' ? 'Pending Review' : app.status}
                      </span>
                    </div>
                  ))}
                  {data && data.myApplications.length > 4 && (
                    <div className="px-4 py-3">
                      <span className="text-xs text-[#2ea043] font-medium">View all {data.myApplications.length} applications</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>


        </aside>
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-[#0d1117]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-lg rounded-2xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Project</h2>
              <button onClick={() => setEditingProject(null)} className="text-gray-500 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <form onSubmit={handleSaveProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Title</label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Description</label>
                <textarea className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Category</label>
                <select className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                  <option value="College Project">College Project</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Startup">Startup</option>
                  <option value="Open Source">Open Source</option>
                  <option value="Research">Research</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Required Skills <span className="text-gray-600">(comma-separated)</span></label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editSkillsStr} onChange={(e) => setEditSkillsStr(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Required Roles <span className="text-gray-600">(comma-separated)</span></label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editRolesStr} onChange={(e) => setEditRolesStr(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-400">Max Team Size</label>
                  <input type="number" min={2} max={20} className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editMaxTeamSize} onChange={(e) => setEditMaxTeamSize(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-400">Status</label>
                  <select className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={editStatus} onChange={(e) => setEditStatus(e.target.value as Project['status'])}>
                    <option value="Recruiting">Recruiting</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingProject(null)} className="px-5 py-2 rounded-lg bg-[#21262d] border border-[#30363d] text-sm text-gray-300 hover:border-[#8b949e]">Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingProject}>{savingProject ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {recommendationsProject && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-4xl rounded-2xl p-6 md:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
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
                        <Link href={`/profile/${rec.candidate.githubUsername}`} className="flex-shrink-0">
                          <img src={rec.candidate.avatarUrl} alt={rec.candidate.name} className="w-12 h-12 rounded-full border border-[#30363d] hover:border-[#58a6ff] transition-colors cursor-pointer" />
                        </Link>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/profile/${rec.candidate.githubUsername}`} className="font-bold text-sm text-white hover:text-[#58a6ff] transition-colors">
                              {rec.candidate.name}
                            </Link>
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
