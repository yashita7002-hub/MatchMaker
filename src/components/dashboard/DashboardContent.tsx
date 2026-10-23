"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import FeedView from '@/components/FeedView';
import PitchModal from '@/components/PitchModal';
import AiTeammateModal from '@/components/AiTeammateModal';
import { DashboardData, DashboardProject } from './DashboardTypes';
import { DashboardStats } from './DashboardStats';
import { MyProjectsSection } from './MyProjectsSection';
import { ActiveProjectsSection } from './ActiveProjectsSection';
import { ApplicationsSection } from './ApplicationsSection';
import { ProjectEditModal } from './ProjectEditModal';

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, globalSocket } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'feed' | 'my-projects' | 'active-projects' | 'applications'>('feed');
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [pitchFeedback, setPitchFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    repoUrl?: string;
  } | null>(null);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  const [recommendationsProject, setRecommendationsProject] = useState<DashboardProject | null>(null);

  const [editingProject, setEditingProject] = useState<DashboardProject | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSkillsStr, setEditSkillsStr] = useState('');
  const [editRolesStr, setEditRolesStr] = useState('');
  const [editMaxTeamSize, setEditMaxTeamSize] = useState('4');
  const [editStatus, setEditStatus] = useState<DashboardProject['status']>('Recruiting');
  const [savingProject, setSavingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const emitNotification = (notification: { userId: string; _id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string }) => {
    if (globalSocket) {
      globalSocket.emit('notify-users', { userIds: [notification.userId], notification });
    }
  };

  const openEditProject = (project: DashboardProject) => {
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

  useEffect(() => {
    const sec = searchParams.get('section');
    if (sec === 'my-projects' || sec === 'active-projects' || sec === 'applications' || sec === 'feed') {
      setActiveSection(sec);
    }
    if (searchParams.get('pitch') === 'true' || searchParams.get('action') === 'pitch') {
      setShowPitchModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOpenPitch = () => setShowPitchModal(true);
    window.addEventListener('open-pitch-modal', handleOpenPitch);
    return () => window.removeEventListener('open-pitch-modal', handleOpenPitch);
  }, []);

  const handleClosePitchModal = () => {
    setShowPitchModal(false);
    if (searchParams.get('pitch') === 'true' || searchParams.get('action') === 'pitch') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('pitch');
      params.delete('action');
      const newQuery = params.toString();
      router.replace(newQuery ? `/dashboard?${newQuery}` : '/dashboard', { scroll: false });
    }
  };

  const handlePitchSuccess = (
    project: any,
    githubSetup?: { success: boolean; repositoryUrl?: string; error?: string } | null
  ) => {
    fetchDashboardData();
    setFeedRefreshKey(prev => prev + 1);
    setActiveSection('my-projects');

    if (githubSetup?.success && githubSetup.repositoryUrl) {
      setPitchFeedback({
        type: 'success',
        title: 'Project Pitched & GitHub Repository Created!',
        message: `"${project.title}" has been published to the Feed and added to your projects.`,
        repoUrl: githubSetup.repositoryUrl,
      });
    } else if (githubSetup && !githubSetup.success) {
      setPitchFeedback({
        type: 'warning',
        title: 'Project Pitched Successfully!',
        message: `"${project.title}" has been created and published. Note on GitHub repository: ${githubSetup.error}`,
      });
    } else {
      setPitchFeedback({
        type: 'success',
        title: 'Project Pitched Successfully!',
        message: `"${project.title}" has been created and published to the Feed.`,
      });
    }

    setTimeout(() => {
      setPitchFeedback(null);
    }, 9000);
  };

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

  const handleOpenRecommendations = (project: DashboardProject) => {
    setRecommendationsProject(project);
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-cyan-400">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 backdrop-blur-sm" />
          </div>
          <span className="text-sm font-mono text-slate-400 tracking-wider">INITIALIZING COSMIC DASHBOARD...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeProjectCount = data?.ownedProjects.filter(p => p.status === 'Active' || p.status === 'Recruiting').length ?? 0;
  const activeTeamCount = data?.activeTeams.length ?? 0;
  const pendingInbound = data?.incomingApplications.filter(a => a.status === 'Pending').length ?? 0;

  return (
    <div className={`w-full max-w-[1440px] mx-auto px-5 md:px-10 xl:px-12 flex flex-col gap-8 md:gap-10 ${
      activeSection === 'feed' ? 'pt-0 pb-8 md:pb-10' : 'flex-1 py-8 md:py-10'
    }`}>
      {/* ── Pitch Feedback Toast Notification ── */}
      {pitchFeedback && (
        <div
          className={`p-4 md:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            pitchFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : pitchFeedback.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                pitchFeedback.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : pitchFeedback.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {pitchFeedback.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">{pitchFeedback.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{pitchFeedback.message}</p>
              {pitchFeedback.repoUrl && (
                <a
                  href={pitchFeedback.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline mt-2"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Open GitHub Repository →</span>
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setPitchFeedback(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg self-start sm:self-center cursor-pointer"
            aria-label="Dismiss feedback"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Feed Section ── */}
      {activeSection === 'feed' && (
        <FeedView
          myApplicationProjectIds={data?.myApplications?.map((a: any) => a.projectId?._id || a.projectId) || []}
          onApplicationSent={fetchDashboardData}
          onPitchClick={() => setShowPitchModal(true)}
          refreshTrigger={feedRefreshKey}
        />
      )}

      {/* ── My Projects, Active Projects, Applications ── */}
      {activeSection !== 'feed' && (
        <>
          <DashboardStats
            user={user}
            data={data}
            activeProjectCount={activeProjectCount}
            activeTeamCount={activeTeamCount}
            pendingInbound={pendingInbound}
            onPitchClick={() => setShowPitchModal(true)}
            onFeedClick={() => setActiveSection('feed')}
          />

          <div className="flex flex-col gap-8 xl:gap-10 2xl:gap-12 items-start mt-20">
            <div className="flex flex-col gap-10 md:gap-12 min-w-0 w-full">
              {activeSection === 'my-projects' && (
                <MyProjectsSection
                  data={data}
                  activeProjectCount={activeProjectCount}
                  expandedProjectId={expandedProjectId}
                  deletingProjectId={deletingProjectId}
                  setExpandedProjectId={setExpandedProjectId}
                  onPitchClick={() => setShowPitchModal(true)}
                  openEditProject={openEditProject}
                  handleDeleteProject={handleDeleteProject}
                  handleOpenRecommendations={handleOpenRecommendations}
                  handleApplicationAction={handleApplicationAction}
                />
              )}

              {activeSection === 'active-projects' && (
                <ActiveProjectsSection data={data} />
              )}

              {activeSection === 'applications' && (
                <ApplicationsSection
                  data={data}
                  handleApplicationAction={handleApplicationAction}
                  handleInvitationAction={handleInvitationAction}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Edit Project Modal ── */}
      <ProjectEditModal
        editingProject={editingProject}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        editSkillsStr={editSkillsStr}
        setEditSkillsStr={setEditSkillsStr}
        editRolesStr={editRolesStr}
        setEditRolesStr={setEditRolesStr}
        editMaxTeamSize={editMaxTeamSize}
        setEditMaxTeamSize={setEditMaxTeamSize}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        savingProject={savingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={handleSaveProject}
      />

      {/* ── AI Teammates Matchmaker Modal ── */}
      <AiTeammateModal
        isOpen={Boolean(recommendationsProject)}
        onClose={() => setRecommendationsProject(null)}
        project={recommendationsProject}
        onInviteSent={() => fetchDashboardData()}
      />

      {/* ── Pitch Modal ── */}
      <PitchModal
        isOpen={showPitchModal}
        onClose={handleClosePitchModal}
        onSuccess={handlePitchSuccess}
      />
    </div>
  );
}
export default DashboardContent;
