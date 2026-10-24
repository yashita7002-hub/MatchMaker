"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ProfileData, ProjectItem, ReviewItem } from '@/components/profile/ProfileTypes';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileOverviewTab } from '@/components/profile/ProfileOverviewTab';
import { ProfileProjectsTab } from '@/components/profile/ProfileProjectsTab';
import { ProfileReviewsTab } from '@/components/profile/ProfileReviewsTab';
import { EditProfileModal } from '@/components/profile/EditProfileModal';

export default function Profile() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, refreshUser } = useApp();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'reviews'>('overview');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState<ProfileData['status']>('Available');
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
        setProjects(data.projects || []);
        setReviews(data.reviews || []);
        setEditName(data.user.name);
        setEditBio(data.user.bio || '');
        setEditStatus(data.user.status);
        setEditSkillsStr(data.user.skills.join(', '));
        setEditRolesStr(data.user.roles.join(', '));
      } else {
        setError('User profile not found.');
      }
    } catch {
      setError('Network error. Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.username) fetchProfile();
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
        body: JSON.stringify({ name: editName, bio: editBio, status: editStatus, skills, roles }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchProfile();
        refreshUser();
      }
    } catch {
      /* noop */
    } finally {
      setUpdating(false);
    }
  };

  const isOwnProfile = currentUser && currentUser.githubUsername === params.username;
  const pinnedRepos = profile?.repositories.slice(0, 6) ?? [];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-cyan-400">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="w-6 h-6 rounded-full bg-cyan-400/20 blur-sm" />
          </div>
          <span className="text-xs font-mono text-slate-400 tracking-wider">RETRIEVING BUILDER PASSPORT...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="glass-panel w-full max-w-md p-10 text-center flex flex-col items-center gap-6 rounded-3xl border border-white/15">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">{error || 'Builder Profile Not Found'}</h2>
          <button onClick={() => router.push('/')} className="btn-primary !text-xs !py-2.5 !px-6 cursor-pointer">Return to Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      {/* 2-Column Horizontal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
        <ProfileSidebar
          profile={profile}
          isOwnProfile={isOwnProfile}
          isEditing={isEditing}
          onEditClick={() => setIsEditing(true)}
        />

        {/* RIGHT CONTENT: Tabs, Graph, Repos, Projects, Reviews */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            {(['overview', 'projects', 'reviews'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold shadow-md shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
                {tab === 'projects' && projects.length > 0 && (
                  <span className="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">{projects.length}</span>
                )}
                {tab === 'reviews' && reviews.length > 0 && (
                  <span className="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">{reviews.length}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <ProfileOverviewTab profile={profile} pinnedRepos={pinnedRepos} />
          )}
  nm n
          {activeTab === 'projects' && (
            <ProfileProjectsTab profile={profile} projects={projects} />
          )}

          {activeTab === 'reviews' && (
            <ProfileReviewsTab reviews={reviews} />
          )}
        </main>
      </div>

      {isOwnProfile && isEditing && (
        <EditProfileModal
          editName={editName}
          setEditName={setEditName}
          editBio={editBio}
          setEditBio={setEditBio}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          editSkillsStr={editSkillsStr}
          setEditSkillsStr={setEditSkillsStr}
          editRolesStr={editRolesStr}
          setEditRolesStr={setEditRolesStr}
          updating={updating}
          onClose={() => setIsEditing(false)}
          onSubmit={handleUpdateProfile}
        />
      )}
    </div>
  );
}
