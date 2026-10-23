"use client";
import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import {
  WorkspaceUser,
  WorkspaceProject,
  Task,
  Discussion,
  VaultLink,
} from './WorkspaceTypes';

interface UseWorkspaceActionsProps {
  projectId: string;
  project: WorkspaceProject | null;
  user: WorkspaceUser | null;
  socketRef: React.MutableRefObject<Socket | null>;
  fetchWorkspaceData: () => Promise<void>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setDiscussions: React.Dispatch<React.SetStateAction<Discussion[]>>;
  setVaultLinks: React.Dispatch<React.SetStateAction<VaultLink[]>>;
}

export function useWorkspaceActions({
  projectId,
  project,
  user,
  socketRef,
  fetchWorkspaceData,
  setTasks,
  setDiscussions,
  setVaultLinks,
}: UseWorkspaceActionsProps) {
  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Thread modal state
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadCategory, setThreadCategory] = useState('Planning');
  const [selectedThread, setSelectedThread] = useState<Discussion | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [savingThread, setSavingThread] = useState(false);

  // Vault modal state
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultLinkName, setVaultLinkName] = useState('');
  const [vaultLinkUrl, setVaultLinkUrl] = useState('');
  const [vaultLinkDescription, setVaultLinkDescription] = useState('');
  const [vaultLinkType, setVaultLinkType] = useState('Code');
  const [savingVaultLink, setSavingVaultLink] = useState(false);
  const [deletingVaultLinkId, setDeletingVaultLinkId] = useState<string | null>(null);
  const [vaultError, setVaultError] = useState('');

  // Review modal state
  const [targetReviewee, setTargetReviewee] = useState<WorkspaceUser | null>(null);
  const [communication, setCommunication] = useState(5);
  const [technicalSkills, setTechnicalSkills] = useState(5);
  const [reliability, setReliability] = useState(5);
  const [teamwork, setTeamwork] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedTeammates, setReviewedTeammates] = useState<string[]>([]);
  const [reviewStatusText, setReviewStatusText] = useState('');

  // Remove modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<WorkspaceUser | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removingMember, setRemovingMember] = useState(false);
  const [removeStatusText, setRemoveStatusText] = useState('');

  const handleUpdateProjectStatus = async (newStatus: 'Active' | 'Completed' | 'Archived') => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const json = await res.json();
        json.notifications?.forEach((notif: { userId: string; _id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string }) => {
          socketRef.current?.emit('notify-users', { userIds: [notif.userId], notification: notif });
        });
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      setSavingTask(true);
      const res = await fetch(`/api/workspace/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          assignedUserId: taskAssigneeId || undefined,
          dueDate: taskDueDate || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setTasks(prev => [...prev, json.task]);
        setTaskTitle('');
        setTaskDesc('');
        setTaskAssigneeId('');
        setTaskDueDate('');
        setShowTaskModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTask(false);
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: Task['status']) => {
    try {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      const res = await fetch(`/api/workspace/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        socketRef.current?.emit('kanban-update', { projectId, taskId, newStatus });
      }
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadTitle.trim()) return;
    try {
      setSavingThread(true);
      const res = await fetch(`/api/workspace/${projectId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: threadTitle, category: threadCategory }),
      });
      if (res.ok) {
        const json = await res.json();
        setDiscussions(prev => [json.discussion, ...prev]);
        setThreadTitle('');
        setShowThreadModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingThread(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyInput.trim()) return;
    try {
      const res = await fetch(`/api/workspace/${projectId}/discussions/${selectedThread._id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyInput }),
      });
      if (res.ok) {
        const json = await res.json();
        setDiscussions(prev => prev.map(d => d._id === selectedThread._id ? json.discussion : d));
        setSelectedThread(json.discussion);
        setReplyInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVaultLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultLinkName.trim() || !vaultLinkUrl.trim()) return;
    
    let icon = 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1';
    if (vaultLinkType === 'Code') icon = 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22';
    else if (vaultLinkType === 'Design') icon = 'M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM12 2h3.5a3.5 3.5 0 1 1 0 7H12V2zM5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5zM12 9h3.5a3.5 3.5 0 1 1 0 7H12V9zM8.5 16A3.5 3.5 0 0 1 12 19.5V16H8.5z';
    else if (vaultLinkType === 'Docs') icon = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8';
    else if (vaultLinkType === 'Infra') icon = 'M2 12l10-7 10 7-10 7-10-7z M2 17l10 7 10-7 M2 7l10 7 10-7';
    
    try {
      setSavingVaultLink(true);
      setVaultError('');
      const res = await fetch(`/api/workspace/${projectId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: vaultLinkName.trim(),
          url: vaultLinkUrl.trim(),
          description: vaultLinkDescription.trim(),
          type: vaultLinkType,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save resource');
      }

      setVaultLinks(prev => [{ ...json.resource, icon }, ...prev]);
      setVaultLinkName('');
      setVaultLinkUrl('');
      setVaultLinkDescription('');
      setVaultLinkType('Code');
      setShowVaultModal(false);
    } catch (err) {
      console.error('Failed to save vault resource:', err);
      setVaultError(err instanceof Error ? err.message : 'Failed to save resource');
    } finally {
      setSavingVaultLink(false);
    }
  };

  const handleDeleteVaultLink = async (resourceId: string) => {
    if (!confirm('Delete this resource from the vault?')) return;

    try {
      setDeletingVaultLinkId(resourceId);
      setVaultError('');
      const res = await fetch(`/api/workspace/${projectId}/resources/${resourceId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete resource');
      }

      setVaultLinks(prev => prev.filter(link => link._id !== resourceId));
    } catch (err) {
      console.error('Failed to delete vault resource:', err);
      setVaultError(err instanceof Error ? err.message : 'Failed to delete resource');
    } finally {
      setDeletingVaultLinkId(null);
    }
  };

  const handleSubmittingTeammateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReviewee) return;

    try {
      setSubmittingReview(true);
      setReviewStatusText('');
      
      const res = await fetch(`/api/workspace/${projectId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revieweeId: targetReviewee._id,
          communication,
          technicalSkills,
          reliability,
          teamwork,
          comment: reviewComment,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setReviewStatusText('Review submitted successfully!');
        setReviewedTeammates(prev => [...prev, targetReviewee._id]);
        setTimeout(() => {
          setTargetReviewee(null);
          setReviewStatusText('');
          setReviewComment('');
        }, 1500);
      } else {
        setReviewStatusText(`Error: ${json.error}`);
      }
    } catch (err) {
      setReviewStatusText('Network error.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberTarget || !project) return;
    try {
      setRemovingMember(true);
      setRemoveStatusText('');
      const res = await fetch(`/api/projects/${projectId}/remove-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: removeMemberTarget._id,
          reason: removeReason,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setRemoveStatusText(`${removeMemberTarget.name} has been removed.`);
        if (json.notification) {
          socketRef.current?.emit('notify-users', { 
            userIds: [removeMemberTarget._id], 
            notification: json.notification 
          });
        }
        if (json.remainingNotifications) {
          json.remainingNotifications.forEach((n: any) => {
            socketRef.current?.emit('notify-users', { userIds: [n.userId], notification: n });
          });
        }
        setTimeout(() => {
          setShowRemoveModal(false);
          setRemoveMemberTarget(null);
          setRemoveReason('');
          setRemoveStatusText('');
          fetchWorkspaceData();
        }, 1500);
      } else {
        setRemoveStatusText(`Error: ${json.error}`);
      }
    } catch (err) {
      setRemoveStatusText('Network error. Could not remove member.');
    } finally {
      setRemovingMember(false);
    }
  };

  return {
    showTaskModal,
    setShowTaskModal,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    taskAssigneeId,
    setTaskAssigneeId,
    taskDueDate,
    setTaskDueDate,
    savingTask,
    handleCreateTask,
    handleMoveTask,

    showThreadModal,
    setShowThreadModal,
    threadTitle,
    setThreadTitle,
    threadCategory,
    setThreadCategory,
    selectedThread,
    setSelectedThread,
    replyInput,
    setReplyInput,
    savingThread,
    handleCreateThread,
    handlePostReply,

    showVaultModal,
    setShowVaultModal,
    vaultLinkName,
    setVaultLinkName,
    vaultLinkUrl,
    setVaultLinkUrl,
    vaultLinkDescription,
    setVaultLinkDescription,
    vaultLinkType,
    setVaultLinkType,
    savingVaultLink,
    deletingVaultLinkId,
    vaultError,
    setVaultError,
    handleAddVaultLink,
    handleDeleteVaultLink,

    targetReviewee,
    setTargetReviewee,
    communication,
    setCommunication,
    technicalSkills,
    setTechnicalSkills,
    reliability,
    setReliability,
    teamwork,
    setTeamwork,
    reviewComment,
    setReviewComment,
    submittingReview,
    reviewedTeammates,
    reviewStatusText,
    handleSubmittingTeammateReview,

    showRemoveModal,
    setShowRemoveModal,
    showAiModal,
    setShowAiModal,
    removeMemberTarget,
    setRemoveMemberTarget,
    removeReason,
    setRemoveReason,
    removingMember,
    removeStatusText,
    setRemoveStatusText,
    handleRemoveMember,
    handleUpdateProjectStatus,
  };
}
