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

  return (
    <div style={{ flex: 1, padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {}
      <div style={{ textAlign: 'center', marginBottom: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
          Find the Perfect <span className="text-gradient">Team Members</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto' }}>
          Pitch project ideas, find matching candidates, collaborate on hackathons or college projects, and build a trusted developers network.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
          {user ? (
            <button onClick={() => setShowPitchModal(true)} className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      <div id="discover" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {}
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search projects, skills, descriptions..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-secondary">Search</button>
          </form>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Category:</span>
              <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                <option value="Hackathon">Hackathon</option>
                <option value="College Project">College Project</option>
                <option value="Startup">Startup</option>
                <option value="Open Source">Open Source</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status:</span>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Recruiting">Recruiting</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            Loading projects matching your interests...
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            No projects found. Try adjusting your search query or filters.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
            {projects.map((project) => {
              const statusLower = project.status.toLowerCase();
              return (
                <div
                  key={project._id}
                  onClick={() => setSelectedProject(project)}
                  className="glass-panel-interactive"
                  style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="badge" style={{
                      background: `rgba(99, 102, 241, 0.1)`,
                      color: `var(--accent-color)`,
                      border: '1px solid var(--border-glass)'
                    }}>{project.category}</span>
                    <span className={`badge badge-${statusLower}`}>{project.status}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>{project.title}</h3>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      lineHeight: '1.45',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{project.description}</p>
                  </div>

                  {}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {project.requiredSkills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {project.requiredSkills.map(skill => (
                          <span key={skill} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.requiredRoles.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {project.requiredRoles.map(role => (
                          <span key={role} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.08)', color: 'var(--accent-color)', fontWeight: 600 }}>
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

                  {}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={project.ownerId.avatarUrl} alt={project.ownerId.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{project.ownerId.name}</span>
                        <TrustStars score={project.ownerId.trustScore} max={5} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      </svg>
                      <span>{project.members.length}/{project.maxTeamSize}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {}
      {showPitchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowPitchModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2>Pitch a New Project Idea</h2>

            {pitchError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', padding: '10px 14px', borderRadius: '6px', color: '#f87171', fontSize: '0.85rem' }}>
                {pitchError}
              </div>
            )}

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input type="text" className="form-input" placeholder="e.g. AI-Powered study planner" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" rows={4} placeholder="Describe the problem you are solving, target users, and technology stack..." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="College Project">College Project</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Startup">Startup</option>
                    <option value="Open Source">Open Source</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Max Team Size *</label>
                  <input type="number" min="2" max="20" className="form-input" value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills (comma-separated)</label>
                <input type="text" className="form-input" placeholder="e.g. React, Mongoose, Python, CSS" value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Required Roles (comma-separated)</label>
                <input type="text" className="form-input" placeholder="e.g. Frontend Developer, UI Designer" value={rolesStr} onChange={(e) => setRolesStr(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowPitchModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Submit Pitch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {selectedProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setSelectedProject(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-color)', border: '1px solid var(--border-glass)' }}>{selectedProject.category}</span>
              <span className={`badge badge-${selectedProject.status.toLowerCase()}`}>{selectedProject.status}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontSize: '1.75rem' }}>{selectedProject.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Created by:</span>
                <img src={selectedProject.ownerId.avatarUrl} alt={selectedProject.ownerId.name} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                <span style={{ fontWeight: 600 }}>{selectedProject.ownerId.name}</span>
                <TrustStars score={selectedProject.ownerId.trustScore} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Description</h4>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{selectedProject.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedProject.requiredSkills.map(skill => (
                    <span key={skill} style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Open Roles</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedProject.requiredRoles.map(role => (
                    <span key={role} style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(139,92,246,0.08)', color: 'var(--accent-color)', fontWeight: 600 }}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Active Team Members ({selectedProject.members.length}/{selectedProject.maxTeamSize})</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selectedProject.members.map(member => (
                  <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
                    <img src={member.avatarUrl} alt={member.name} style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{member.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

            {}
            {user ? (
              user._id === selectedProject.ownerId._id ? (
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border-glass-active)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You own this project. Go to your Dashboard to invite candidates or manage pending applications!</p>
                  <Link href="/dashboard" className="btn-primary" style={{ marginTop: '12px' }} onClick={() => setSelectedProject(null)}>
                    Go to Dashboard
                  </Link>
                </div>
              ) : selectedProject.members.some(m => m._id === user._id) ? (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You are a member of this project team! Open the collaborative workspace hub now.</p>
                  <Link href={`/workspace/${selectedProject._id}`} className="btn-primary" style={{ marginTop: '12px' }} onClick={() => setSelectedProject(null)}>
                    Enter Team Workspace
                  </Link>
                </div>
              ) : selectedProject.status !== 'Recruiting' ? (
                <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)' }}>
                  This project is no longer accepting applications (Status: {selectedProject.status}).
                </div>
              ) : (
                <form onSubmit={handleApplyToTeam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3>Apply to Join the Team</h3>
                  
                  {appStatusText && (
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem' }}>
                      {appStatusText}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Select Target Role *</label>
                    <select className="form-select" value={appRole} onChange={(e) => setAppRole(e.target.value)} required>
                      <option value="">-- Select a role --</option>
                      {selectedProject.requiredRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                      <option value="General Collaborator">General Collaborator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cover Letter / Why do you want to join? *</label>
                    <textarea className="form-textarea" rows={3} placeholder="Describe your skills, what you can contribute, and why you are interested in this idea..." value={appCover} onChange={(e) => setAppCover(e.target.value)} required />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" onClick={() => setSelectedProject(null)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary" disabled={!appRole || !appCover.trim()}>
                      Submit Application
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>You must be logged in to apply to this team.</p>
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
