"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import ContributionGraph from '@/components/ContributionGraph';
import TrustStars from '@/components/TrustStars';

interface ProfileData {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  bio: string;
  status: 'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects';
  skills: string[];
  roles: string[];
  trustScore: number;
  reviewsCount: number;
  repositories: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    url: string;
  }>;
}

export default function Profile() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, refreshUser } = useApp();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState<'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects'>('Available');
  const [editSkillsStr, setEditSkillsStr] = useState('');
  const [editRolesStr, setEditRolesStr] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${params.username}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        
        
        setEditName(data.user.name);
        setEditBio(data.user.bio || '');
        setEditStatus(data.user.status);
        setEditSkillsStr(data.user.skills.join(', '));
        setEditRolesStr(data.user.roles.join(', '));
      } else {
        setError('User profile not found.');
      }
    } catch (err) {
      setError('Network error. Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.username) {
      fetchProfile();
    }
  }, [params.username]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const skills = editSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const roles = editRolesStr.split(',').map(r => r.trim()).filter(Boolean);

      const res = await fetch('/api/users/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          status: editStatus,
          skills,
          roles,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchProfile(); 
        refreshUser(); 
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  const isOwnProfile = currentUser && currentUser.githubUsername === params.username;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
        Loading student developer profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '40px 32px' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Profile Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error || 'User not found.'}</p>
          <button onClick={() => router.push('/')} className="btn-primary">Back to Discover</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '40px 24px', maxWidth: '960px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {}
      <div className="glass-panel" style={{ padding: '40px 32px', display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', position: 'relative' }}>
        <img src={profile.avatarUrl} alt={profile.name} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px solid var(--border-glass-active)', boxShadow: 'var(--accent-glow)' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '2.25rem' }}>{profile.name}</h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>@{profile.githubUsername}</span>
            <span className={`badge badge-${profile.status.toLowerCase().replace(/\s+/g, '-')}`}>{profile.status}</span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5' }}>
            {profile.bio || 'This student has not written a bio yet.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '4px' }}>
            {}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TRUST SCORE</span>
              <TrustStars score={profile.trustScore} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>COMPLETED PROJECTS</span>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>{profile.reviewsCount} completed</span>
            </div>
          </div>
        </div>

        {isOwnProfile && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ position: 'absolute', top: '24px', right: '24px', padding: '8px 16px', fontSize: '0.9rem' }}>
            Edit Profile
          </button>
        )}
      </div>

      {}
      {isOwnProfile && isEditing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Edit Profile Details</h2>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-textarea" rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Availability Status</label>
                <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Looking for Team">Looking for Team</option>
                  <option value="Looking for Projects">Looking for Projects</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Skills (comma-separated)</label>
                <input type="text" className="form-input" value={editSkillsStr} onChange={(e) => setEditSkillsStr(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Roles (comma-separated)</label>
                <input type="text" className="form-input" value={editRolesStr} onChange={(e) => setEditRolesStr(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>GitHub Contribution Graph</h3>
        <ContributionGraph username={profile.githubUsername} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', flexWrap: 'wrap' }}>
        {}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Verified Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.skills.length > 0 ? (
                profile.skills.map(skill => (
                  <span key={skill} style={{ fontSize: '0.85rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
                    {skill}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills cataloged yet.</span>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Target Team Roles</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.roles.length > 0 ? (
                profile.roles.map(role => (
                  <span key={role} style={{ fontSize: '0.85rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(139,92,246,0.08)', color: 'var(--accent-color)', fontWeight: 600 }}>
                    {role}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No preferred roles specified.</span>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Public GitHub Repositories</h3>
          {profile.repositories.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No public repositories detected for this user.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profile.repositories.map(repo => (
                <div key={repo.name} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--accent-color)', fontSize: '1.05rem' }} className="nav-link">
                      {repo.name}
                    </a>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--warning)' }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>{repo.stars} stars</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {repo.description}
                  </p>

                  {repo.language && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: repo.language === 'TypeScript' ? '#3178c6' : repo.language === 'JavaScript' ? '#f1e05a' : '#8b5cf6' }}></span>
                      <span>{repo.language}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
