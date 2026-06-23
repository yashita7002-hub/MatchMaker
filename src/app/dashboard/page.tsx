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
      if (res.ok) {
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
        body: JSON.stringify({
          userId: candidateId,
          role,
        }),
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
      <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
        Loading your Matchmaker Dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', maxWidth: '500px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>You must log in to view your dashboard.</p>
          <Link href="/login" className="btn-primary">Login with GitHub</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem' }}>Matchmaker Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your pitched projects, applications, and team workspace hubs.</p>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px', flexWrap: 'wrap' }}>
        
        {}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '24px' }}>My Pitched Projects</h2>
            
            {data?.ownedProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: '16px' }}>You have not pitched any project ideas yet.</p>
                <Link href="/" className="btn-primary">Pitch an Idea</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {data?.ownedProjects.map(project => {
                  const hasApplications = data.incomingApplications.some(a => a.projectId._id === project._id);
                  const projectApps = data.incomingApplications.filter(a => a.projectId._id === project._id);
                  const projectInvites = data.outgoingInvitations.filter(i => i.projectId._id === project._id);
                  
                  return (
                    <div key={project._id} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem' }}>{project.title}</h3>
                          <span className={`badge badge-${project.status.toLowerCase()}`} style={{ marginTop: '4px' }}>{project.status}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenRecommendations(project)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" /><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.73 9.94" />
                            </svg>
                            AI Recommendations
                          </button>
                          
                          {project.members.length >= 2 && (
                            <Link href={`/workspace/${project._id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                              Enter Hub Workspace
                            </Link>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Members: <strong>{project.members.length}/{project.maxTeamSize}</strong></span>
                        <span>Pending Applications: <strong>{projectApps.length}</strong></span>
                        <span>Invitations Sent: <strong>{projectInvites.length}</strong></span>
                      </div>

                      {}
                      {projectApps.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-glass)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Pending Applicant Requests:</h4>
                          {projectApps.map(app => (
                            <div key={app._id} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <img src={app.userId.avatarUrl} alt={app.userId.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{app.userId.name}</span>
                                    <TrustStars score={app.userId.trustScore} />
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role applied: <strong>{app.role}</strong></span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleApplicationAction(app._id, 'Accepted')} className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--success)', boxShadow: 'none' }}>Accept</button>
                                <button onClick={() => handleApplicationAction(app._id, 'Rejected')} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Reject</button>
                              </div>
                              <div style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                                <em>"{app.coverLetter}"</em>
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

          {}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '24px' }}>My Collaboration Workspaces (Active Teams)</h2>
            {data?.activeTeams.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>You are not currently in any other project team. Apply to projects to collaborate!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data?.activeTeams.map(project => (
                  <div key={project._id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem' }}>{project.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Owner: {project.ownerId.name} | Teammates: {project.members.length}</p>
                    </div>
                    <Link href={`/workspace/${project._id}`} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                      Enter Hub Workspace
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Team Invitations</h3>
            {data?.myInvitations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>No pending team invitations received.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data?.myInvitations.map(invite => (
                  <div key={invite._id} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem' }}>{invite.projectId.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invited by: <strong>{invite.projectId.ownerId.name}</strong></p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, marginTop: '2px' }}>Role offered: {invite.role}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleInvitationAction(invite._id, 'Accepted')} className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--success)', boxShadow: 'none' }}>Accept</button>
                      <button onClick={() => handleInvitationAction(invite._id, 'Declined')} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>My Applications</h3>
            {data?.myApplications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>You have not applied to any project teams yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data?.myApplications.map(app => (
                  <div key={app._id} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem' }}>{app.projectId.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role: {app.role}</span>
                    </div>
                    <span className={`badge badge-${app.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{app.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {recommendationsProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setRecommendationsProject(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Candidate Matchmaker</span>
              <h2 style={{ marginTop: '2px' }}>Recommendations for: {recommendationsProject.title}</h2>
            </div>

            {loadingRecs ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Analyzing available profiles, repository languages, activity calendar, and ratings...
              </div>
            ) : recommendations.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No matching candidate profiles found in the database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                {recommendations.slice(0, 5).map(rec => {
                  const status = inviteStatusMap[rec.candidate._id] || 'idle';
                  return (
                    <div key={rec.candidate._id} style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                      
                      {}
                      <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: '280px' }}>
                        <img src={rec.candidate.avatarUrl} alt={rec.candidate.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{rec.candidate.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '6px' }}>@{rec.candidate.githubUsername}</span>
                            <span className={`badge badge-${rec.candidate.status.toLowerCase().replace(/\s+/g, '-')}`} style={{ marginLeft: '8px', fontSize: '0.65rem', padding: '2px 6px' }}>{rec.candidate.status}</span>
                          </div>
                          
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rec.candidate.bio}</p>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                            {rec.candidate.skills.slice(0, 5).map(skill => (
                              <span key={skill} style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>{skill}</span>
                            ))}
                          </div>

                          {}
                          <div style={{ marginTop: '8px', background: 'rgba(139,92,246,0.03)', borderLeft: '3px solid var(--accent-color)', padding: '8px 12px', borderRadius: '0 8px 8px 0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-color)' }}>Matching Report:</span>
                            {rec.reasons.map((reason, idx) => (
                              <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: 'var(--success)' }}>✓</span> {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '180px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-color)', textAlign: 'right' }}>{rec.matchScore}% Match Score</span>
                          <TrustStars score={rec.candidate.trustScore} />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Role Offered:</label>
                          <select
                            className="form-select"
                            value={inviteRoleMap[rec.candidate._id] || ''}
                            onChange={(e) => setInviteRoleMap({ ...inviteRoleMap, [rec.candidate._id]: e.target.value })}
                            style={{ fontSize: '0.75rem', padding: '6px' }}
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
                          className="btn-primary"
                          style={{ padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
                          disabled={status === 'sending' || status === 'sent'}
                        >
                          {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Invitation Sent!' : 'Send Team Invite'}
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
