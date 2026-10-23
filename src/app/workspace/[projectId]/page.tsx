"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import AiTeammateModal from '@/components/AiTeammateModal';
import {
  WorkspaceProject,
  Task,
  Discussion,
  Expense,
  VaultLink,
  ActiveTab,
} from '@/components/workspace/WorkspaceTypes';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import ChatTab from '@/components/workspace/ChatTab';
import KanbanTab from '@/components/workspace/KanbanTab';
import DiscussionsTab from '@/components/workspace/DiscussionsTab';
import VaultTab from '@/components/workspace/VaultTab';
import ExpensesTab from '@/components/workspace/ExpensesTab';
import ReviewsTab from '@/components/workspace/ReviewsTab';
import AnalyticsTab from '@/components/workspace/AnalyticsTab';
import {
  TaskModal,
  ThreadModal,
  ExpenseModal,
  VaultModal,
  RemoveMemberModal,
} from '@/components/workspace/WorkspaceModals';
import { useWorkspaceChat } from '@/components/workspace/useWorkspaceChat';
import { useWorkspaceActions } from '@/components/workspace/useWorkspaceActions';
import { useWorkspaceExpenses } from '@/components/workspace/useWorkspaceExpenses';

export default function WorkspaceHub() {
  const params = useParams();
  const { user, markChatNotificationsAsRead } = useApp();
  const projectId = params.projectId as string;
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [project, setProject] = useState<WorkspaceProject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<Task['status'] | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vaultLinks, setVaultLinks] = useState<VaultLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchWorkspaceData = async () => {
    try {
      const res = await fetch(`/api/workspace/${projectId}`);
      if (res.ok) {
        const json = await res.json();
        setProject(json.project);
        chat.setMessages(json.messages);
        await markChatNotificationsAsRead({ projectId });
        setTasks(json.tasks);
        setDiscussions(json.discussions);
        setExpenses(json.expenses);
        setVaultLinks(json.resources);
      } else if (res.status === 403) {
        setForbidden(true);
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const chat = useWorkspaceChat({
    projectId,
    user: user as any,
    onRefreshWorkspace: fetchWorkspaceData,
    onTasksUpdate: setTasks,
  });

  const actions = useWorkspaceActions({
    projectId,
    project,
    user: user as any,
    socketRef: chat.socketRef,
    fetchWorkspaceData,
    setTasks,
    setDiscussions,
    setVaultLinks,
  });

  const exp = useWorkspaceExpenses({
    projectId,
    project,
    socketRef: chat.socketRef,
    setExpenses,
  });

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const res = await fetch(`/api/projects/${projectId}/analytics`);
      if (res.ok) {
        const json = await res.json();
        setAnalyticsData(json);
      } else {
        setAnalyticsError('Failed to load analytics');
      }
    } catch (err: any) {
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, projectId]);

  useEffect(() => {
    if (user && projectId) {
      fetchWorkspaceData();
    }
  }, [user, projectId]);

  const findUsernameByName = (name: string): string | null => {
    const member = project?.members.find(m => m.name === name);
    return member?.githubUsername || null;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-cyan-400">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="w-6 h-6 rounded-full bg-cyan-400/20 blur-sm" />
          </div>
          <span className="text-xs font-mono text-slate-400 tracking-wider">SYNCING COLLABORATIVE SOCKET HUB...</span>
        </div>
      </div>
    );
  }

  if (forbidden || !project) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="glass-panel w-full max-w-md p-10 text-center flex flex-col items-center gap-6 rounded-3xl border border-white/15">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/30 text-rose-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Private Squad Enclave</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            This collaborative workspace is reserved for active project teammates. Apply or accept your team invitation to enter.
          </p>
          <Link href="/dashboard" className="btn-primary w-full justify-center !text-xs !py-2.5">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
      <WorkspaceHeader
        project={project}
        activeTab={activeTab}
        userId={user?._id}
        onTabChange={setActiveTab}
        onFindTeammates={() => actions.setShowAiModal(true)}
        onManageSquad={() => actions.setShowRemoveModal(true)}
        onMarkComplete={() => actions.handleUpdateProjectStatus('Completed')}
      />

      <div className="flex-1 flex flex-col min-h-[500px]">
        {activeTab === 'chat' && (
          <ChatTab
            messages={chat.messages}
            typingUser={chat.typingUser}
            chatInput={chat.chatInput}
            chatFiles={chat.chatFiles}
            chatReplyTo={chat.chatReplyTo}
            uploadingImage={chat.uploadingImage}
            chatUploadProgress={chatUploadProgressSelector(chat.chatUploadProgress)}
            chatError={chat.chatError}
            userId={user?._id}
            projectTitle={project.title}
            chatBottomRef={chat.chatBottomRef as React.RefObject<HTMLDivElement>}
            onInputChange={chat.handleChatInputChange}
            onFilesChange={chat.setChatFiles}
            onReplyTo={chat.setChatReplyTo}
            onSendMessage={chat.handleSendMessage}
            onUpdateMessage={chat.updateProjectMessage}
            onSaveMessage={chat.saveProjectMessage}
            onDownloadText={chat.downloadMessageText}
            findUsernameByName={findUsernameByName}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanTab
            tasks={tasks}
            members={project.members}
            draggedTaskId={draggedTaskId}
            dropTargetStatus={dropTargetStatus}
            onSetDraggedTaskId={setDraggedTaskId}
            onSetDropTargetStatus={setDropTargetStatus}
            onMoveTask={actions.handleMoveTask}
            onOpenCreateTask={() => actions.setShowTaskModal(true)}
          />
        )}

        {activeTab === 'discussions' && (
          <DiscussionsTab
            discussions={discussions}
            selectedThread={actions.selectedThread}
            replyInput={actions.replyInput}
            onSelectThread={actions.setSelectedThread}
            onReplyInputChange={actions.setReplyInput}
            onPostReply={actions.handlePostReply}
            onOpenNewThread={() => actions.setShowThreadModal(true)}
          />
        )}

        {activeTab === 'vault' && (
          <VaultTab
            vaultLinks={vaultLinks}
            vaultError={actions.vaultError}
            showVaultModal={actions.showVaultModal}
            deletingVaultLinkId={actions.deletingVaultLinkId}
            onOpenAddLink={() => actions.setShowVaultModal(true)}
            onDeleteLink={actions.handleDeleteVaultLink}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            project={project}
            expenses={expenses}
            user={user as any}
            expandedExpenseId={exp.expandedExpenseId}
            paymentActionKey={exp.paymentActionKey}
            paymentActionError={exp.paymentActionError}
            paymentActionMessage={exp.paymentActionMessage}
            onOpenExpenseModal={() => {
              exp.setExpenseError('');
              exp.setExpenseParticipantIds(project.members.map(member => member._id));
              exp.setExpenseShares({});
              exp.setCustomExpenseSplit(false);
              exp.setShowExpenseModal(true);
            }}
            onToggleBreakdown={(id) => exp.setExpandedExpenseId(current => current === id ? null : id)}
            onExpensePaymentAction={exp.handleExpensePaymentAction}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab
            project={project}
            user={user as any}
            targetReviewee={actions.targetReviewee}
            onSelectReviewee={actions.setTargetReviewee}
            reviewedTeammates={actions.reviewedTeammates}
            reviewStatusText={actions.reviewStatusText}
            communication={actions.communication}
            onChangeCommunication={actions.setCommunication}
            technicalSkills={actions.technicalSkills}
            onChangeTechnicalSkills={actions.setTechnicalSkills}
            reliability={actions.reliability}
            onChangeReliability={actions.setReliability}
            teamwork={actions.teamwork}
            onChangeTeamwork={actions.setTeamwork}
            reviewComment={actions.reviewComment}
            onChangeReviewComment={actions.setReviewComment}
            submittingReview={actions.submittingReview}
            onSubmitReview={actions.handleSubmittingTeammateReview}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            analyticsLoading={analyticsLoading}
            analyticsData={analyticsData}
            analyticsError={analyticsError}
          />
        )}
      </div>

      <TaskModal
        isOpen={actions.showTaskModal}
        onClose={() => actions.setShowTaskModal(false)}
        project={project}
        todayStr={todayStr}
        taskTitle={actions.taskTitle}
        onChangeTaskTitle={actions.setTaskTitle}
        taskDesc={actions.taskDesc}
        onChangeTaskDesc={actions.setTaskDesc}
        taskAssigneeId={actions.taskAssigneeId}
        onChangeTaskAssigneeId={actions.setTaskAssigneeId}
        taskDueDate={actions.taskDueDate}
        onChangeTaskDueDate={actions.setTaskDueDate}
        savingTask={actions.savingTask}
        onSubmit={actions.handleCreateTask}
      />

      <ThreadModal
        isOpen={actions.showThreadModal}
        onClose={() => actions.setShowThreadModal(false)}
        threadTitle={actions.threadTitle}
        onChangeThreadTitle={actions.setThreadTitle}
        threadCategory={actions.threadCategory}
        onChangeThreadCategory={actions.setThreadCategory}
        savingThread={actions.savingThread}
        onSubmit={actions.handleCreateThread}
      />

      <ExpenseModal
        isOpen={exp.showExpenseModal}
        onClose={() => { exp.setShowExpenseModal(false); exp.setExpenseError(''); }}
        project={project}
        user={user as any}
        expenseError={exp.expenseError}
        expenseTitle={exp.expenseTitle}
        onChangeExpenseTitle={exp.setExpenseTitle}
        expenseAmount={exp.expenseAmount}
        onChangeExpenseAmount={exp.setExpenseAmount}
        expenseCategory={exp.expenseCategory}
        onChangeExpenseCategory={exp.setExpenseCategory}
        expenseDesc={exp.expenseDesc}
        onChangeExpenseDesc={exp.setExpenseDesc}
        expenseParticipantIds={exp.expenseParticipantIds}
        setExpenseParticipantIds={exp.setExpenseParticipantIds}
        customExpenseSplit={exp.customExpenseSplit}
        setCustomExpenseSplit={exp.setCustomExpenseSplit}
        expenseShares={exp.expenseShares}
        setExpenseShares={exp.setExpenseShares}
        loggingExpense={exp.loggingExpense}
        onSubmit={exp.handleLogExpense}
      />

      <VaultModal
        isOpen={actions.showVaultModal}
        onClose={() => { actions.setShowVaultModal(false); actions.setVaultError(''); }}
        vaultError={actions.vaultError}
        vaultLinkName={actions.vaultLinkName}
        onChangeVaultLinkName={actions.setVaultLinkName}
        vaultLinkUrl={actions.vaultLinkUrl}
        onChangeVaultLinkUrl={actions.setVaultLinkUrl}
        vaultLinkDescription={actions.vaultLinkDescription}
        onChangeVaultLinkDescription={actions.setVaultLinkDescription}
        vaultLinkType={actions.vaultLinkType}
        onChangeVaultLinkType={actions.setVaultLinkType}
        savingVaultLink={actions.savingVaultLink}
        onSubmit={actions.handleAddVaultLink}
      />

      <RemoveMemberModal
        isOpen={actions.showRemoveModal}
        onClose={() => {
          actions.setShowRemoveModal(false);
          actions.setRemoveMemberTarget(null);
          actions.setRemoveReason('');
          actions.setRemoveStatusText('');
        }}
        project={project}
        user={user as any}
        removeMemberTarget={actions.removeMemberTarget}
        onSelectMemberTarget={actions.setRemoveMemberTarget}
        removeReason={actions.removeReason}
        onChangeRemoveReason={actions.setRemoveReason}
        removingMember={actions.removingMember}
        removeStatusText={actions.removeStatusText}
        onConfirmRemove={actions.handleRemoveMember}
      />

      <AiTeammateModal
        isOpen={actions.showAiModal}
        onClose={() => actions.setShowAiModal(false)}
        project={project as any}
        onInviteSent={fetchWorkspaceData}
      />
    </div>
  );
}

function chatUploadProgressSelector(p: string) {
  return p;
}
