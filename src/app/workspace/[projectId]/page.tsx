"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { io, Socket } from 'socket.io-client';
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
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  ownerId: User;
  members: User[];
  maxTeamSize: number;
}

interface Message {
  _id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assignedUserId?: string;
  assignedUserName?: string;
  dueDate?: string;
}

interface Discussion {
  _id: string;
  title: string;
  category: string;
  creatorName: string;
  createdAt: string;
  replies: Array<{
    _id: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: string;
  }>;
}

interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  loggedBy: string;
  createdAt: string;
}

export default function WorkspaceHub() {
  const params = useParams();
  const router = useRouter();
  const { user } = useApp();
  const projectId = params.projectId as string;
  
  const [activeTab, setActiveTab] = useState<'chat' | 'kanban' | 'discussions' | 'vault' | 'expenses' | 'reviews' | 'analytics'>('chat');
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  
  const socketRef = useRef<Socket | null>(null);
  const [typingUser, setTypingUser] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  
  const [chatInput, setChatInput] = useState('');
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadCategory, setThreadCategory] = useState('Planning');
  const [selectedThread, setSelectedThread] = useState<Discussion | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [savingThread, setSavingThread] = useState(false);

  
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Hosting');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [loggingExpense, setLoggingExpense] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultLinkName, setVaultLinkName] = useState('');
  const [vaultLinkUrl, setVaultLinkUrl] = useState('');
  const [vaultLinkType, setVaultLinkType] = useState('Code');
  const [vaultLinks, setVaultLinks] = useState([
    { name: 'GitHub Repository', url: 'https://github.com/org/repo', type: 'Code', icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' },
    { name: 'Figma Design Files', url: 'https://figma.com/file/xyz', type: 'Design', icon: 'M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM12 2h3.5a3.5 3.5 0 1 1 0 7H12V2zM5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5zM12 9h3.5a3.5 3.5 0 1 1 0 7H12V9zM8.5 16A3.5 3.5 0 1 1 12 19.5V16H8.5z' },
    { name: 'Pitch Deck', url: 'https://docs.google.com/presentation', type: 'Docs', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
    { name: 'AWS S3 Bucket', url: 'https://aws.amazon.com/s3', type: 'Infra', icon: 'M2 12l10-7 10 7-10 7-10-7z M2 17l10 7 10-7 M2 7l10 7 10-7' }
  ]);

  
  const [targetReviewee, setTargetReviewee] = useState<User | null>(null);
  const [communication, setCommunication] = useState(5);
  const [technicalSkills, setTechnicalSkills] = useState(5);
  const [reliability, setReliability] = useState(5);
  const [teamwork, setTeamwork] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedTeammates, setReviewedTeammates] = useState<string[]>([]);
  const [reviewStatusText, setReviewStatusText] = useState('');

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

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

  const fetchWorkspaceData = async () => {
    try {
      const res = await fetch(`/api/workspace/${projectId}`);
      if (res.ok) {
        const json = await res.json();
        setProject(json.project);
        setMessages(json.messages);
        setTasks(json.tasks);
        setDiscussions(json.discussions);
        setExpenses(json.expenses);
      } else if (res.status === 403) {
        setForbidden(true);
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setLoading(false);
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
      
      // Connect to the unified server using the current origin
      socketRef.current = io();
      socketRef.current.emit('join-room', { projectId });

      
      socketRef.current.on('receive-message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      socketRef.current.on('typing-update', ({ userName, isTyping }) => {
        setTypingUser(isTyping ? userName : '');
      });

      socketRef.current.on('kanban-update', ({ taskId, newStatus }) => {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      });

      socketRef.current.on('expense-refresh', () => {
        fetchWorkspaceData();
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user, projectId]);

  useEffect(() => {
    
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUser]);

  
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

  
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed: ${text}`);
    }

    const json = await res.json();
    return json.imageUrl;
  };

  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !chatImageFile) return;

    let imageUrl = '';
    try {
      if (chatImageFile) {
        setUploadingImage(true);
        imageUrl = await uploadImage(chatImageFile);
      }

      const res = await fetch(`/api/workspace/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chatInput,
          imageUrl,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        
        socketRef.current?.emit('send-message', { projectId, message: json.message });
        setMessages(prev => [...prev, json.message]);

        json.notifications?.forEach((notif: { userId: string; _id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string }) => {
          socketRef.current?.emit('notify-users', { userIds: [notif.userId], notification: notif });
        });
        
        setChatInput('');
        setChatImageFile(null);
        
        socketRef.current?.emit('typing-indicator', { projectId, userName: user?.name, isTyping: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    
    
    socketRef.current?.emit('typing-indicator', { projectId, userName: user?.name, isTyping: true });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing-indicator', { projectId, userName: user?.name, isTyping: false });
    }, 2000);
  };

  
  const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done') => {
    try {
      const res = await fetch(`/api/workspace/${projectId}/kanban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        socketRef.current?.emit('kanban-drag', { projectId, taskId, newStatus });
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
      const assignee = project?.members.find(m => m._id === taskAssigneeId);
      
      const res = await fetch(`/api/workspace/${projectId}/kanban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          assignedUserId: taskAssigneeId || undefined,
          assignedUserName: assignee ? assignee.name : '',
          dueDate: taskDueDate,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setTasks(prev => [...prev, json.task]);

        if (json.notification) {
          socketRef.current?.emit('notify-users', {
            userIds: [json.notification.userId],
            notification: json.notification,
          });
        }
        
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
        setDiscussions(prev => [json.thread, ...prev]);
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
    if (!replyInput.trim() || !selectedThread) return;

    try {
      const res = await fetch(`/api/workspace/${projectId}/discussions/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThread._id, text: replyInput }),
      });
      if (res.ok) {
        const json = await res.json();
        setDiscussions(prev => prev.map(d => d._id === selectedThread._id ? json.thread : d));
        setSelectedThread(json.thread);
        setReplyInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    try {
      setLoggingExpense(true);
      const res = await fetch(`/api/workspace/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expenseTitle,
          amount: Number(expenseAmount),
          category: expenseCategory,
          description: expenseDesc,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setExpenses(prev => [json.expense, ...prev]);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseDesc('');
        setShowExpenseModal(false);
        socketRef.current?.emit('expense-update', { projectId });
        json.notifications?.forEach((notif: { userId: string; _id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string }) => {
          socketRef.current?.emit('notify-users', { userIds: [notif.userId], notification: notif });
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingExpense(false);
    }
  };

  const handleAddVaultLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultLinkName || !vaultLinkUrl) return;
    
    let icon = 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1';
    if (vaultLinkType === 'Code') icon = 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22';
    else if (vaultLinkType === 'Design') icon = 'M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM12 2h3.5a3.5 3.5 0 1 1 0 7H12V2zM5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5zM12 9h3.5a3.5 3.5 0 1 1 0 7H12V9zM8.5 16A3.5 3.5 0 1 1 12 19.5V16H8.5z';
    else if (vaultLinkType === 'Docs') icon = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8';
    else if (vaultLinkType === 'Infra') icon = 'M2 12l10-7 10 7-10 7-10-7z M2 17l10 7 10-7 M2 7l10 7 10-7';
    
    setVaultLinks([...vaultLinks, { name: vaultLinkName, url: vaultLinkUrl, type: vaultLinkType, icon }]);
    setVaultLinkName('');
    setVaultLinkUrl('');
    setShowVaultModal(false);
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

  const totalExpenseSum = expenses.reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-indigo-400">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-slate-400 text-sm">Loading team collaboration hub...</span>
        </div>
      </div>
    );
  }

  if (forbidden || !project) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="glass-card w-full max-w-md p-10 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-heading font-bold text-red-400">Access Forbidden</h2>
          <p className="text-slate-400">You are not authorized to view this private workspace. Access is restricted to accepted team members only.</p>
          <Link href="/dashboard" className="btn-primary w-full justify-center">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 relative">
      
      {}
      {/* Header Panel */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{project.title} <span className="text-gray-400 font-normal">· Team Hub</span></h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#1f6feb]/10 text-[#58a6ff] border-[#1f6feb]/30">Private</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#2ea043]"></div>
                Available
              </div>
              <span>·</span>
              <span>{project.members.length} members</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Member Avatars */}
          <div className="flex -space-x-2 mr-4">
            {project.members.map((m) => (
              m.avatarUrl ? 
              <img key={m._id} src={m.avatarUrl} alt={m.name} className="w-8 h-8 rounded-full border-2 border-[#0d1117]" /> :
              <div key={m._id} className="w-8 h-8 rounded-full border-2 border-[#0d1117] bg-[#8b5cf6] text-white flex items-center justify-center text-xs font-bold">
                {m.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          {user?._id === project.ownerId._id && project.status !== 'Completed' && project.status !== 'Archived' && (
            <div className="flex gap-2">
              {project.status === 'Active' && (
                <button onClick={() => handleUpdateProjectStatus('Completed')} className="px-3 py-1.5 rounded-md bg-[#2ea043]/10 border border-[#2ea043]/30 text-[#2ea043] text-sm font-semibold hover:bg-[#2ea043]/20 transition-colors">
                  Complete Project
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#30363d] flex gap-6 px-2 overflow-x-auto">
        {(['chat', 'kanban', 'discussions', 'vault', 'expenses', 'reviews', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedThread(null); }}
            className={`py-3 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === tab
                ? 'border-[#ff7b72] text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'chat' ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Chat</> :
             tab === 'kanban' ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg> Board</> :
             tab === 'discussions' ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Discussions</> :
             tab === 'vault' ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> Vault</> :
             tab === 'expenses' ? <><span className="font-bold">$</span> Expenses</> :
             tab === 'analytics' ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Analytics</> :
             <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> Reviews</>}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[520px] flex flex-col">
        
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1 h-full rounded-xl border border-[#30363d] bg-[#0d1117]">
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 max-h-[500px]">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 m-auto">No messages yet. Send a greeting to start collaborating!</p>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = user?.name === msg.senderName;
                  return (
                    <div key={msg._id || idx} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                      {msg.senderAvatar ? 
                        <img src={msg.senderAvatar} alt={msg.senderName} className="w-10 h-10 rounded-full border border-[#30363d]" /> :
                        <div className="w-10 h-10 rounded-full border border-[#30363d] bg-[#8b5cf6] text-white flex items-center justify-center font-bold text-sm">
                          {msg.senderName.substring(0, 2).toUpperCase()}
                        </div>
                      }
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%] gap-1`}>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-gray-400">{msg.senderName}</span>
                          <span className="text-[10px] text-gray-600">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className={`px-4 py-2.5 text-sm ${isMe ? 'bg-[#1f6feb]/20 text-[#c9d1d9] border border-[#1f6feb]/30 rounded-2xl rounded-tr-sm' : 'bg-[#161b22] text-[#c9d1d9] border border-[#30363d] rounded-2xl rounded-tl-sm'}`}>
                          {msg.text}
                          {msg.imageUrl && (
                            <img src={msg.imageUrl} alt="Attached" className="max-w-full max-h-[200px] rounded-lg mt-2 border border-[#30363d]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {typingUser && (
                <div className="flex gap-4 items-center">
                  <div className="text-xs text-gray-500 italic">{typingUser} is typing...</div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-[#161b22] border-t border-[#30363d] flex items-center gap-3 rounded-b-xl">
              <label className="cursor-pointer text-gray-400 hover:text-white p-2 bg-[#0d1117] border border-[#30363d] rounded-md transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                <input type="file" accept="image/*" onChange={(e) => setChatImageFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
              </label>
              {chatImageFile && <span className="text-xs bg-[#0d1117] border border-[#30363d] px-2 py-1 rounded text-gray-300 truncate max-w-[100px]">{chatImageFile.name}</span>}
              <input type="text" className="flex-1 bg-[#0d1117] border border-[#30363d] text-sm text-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:border-[#58a6ff]" placeholder="Write a message..." value={chatInput} onChange={handleChatInputChange} disabled={uploadingImage} />
              <button type="submit" className="btn-primary" disabled={uploadingImage || (!chatInput.trim() && !chatImageFile)}>
                {uploadingImage ? '...' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
              </button>
            </form>
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="flex flex-col gap-4">
            {!selectedThread ? (
              <>
                <div className="flex justify-between items-center mb-2 border-b border-[#30363d] pb-4">
                  <h3 className="text-lg font-bold text-white">Discussions</h3>
                  <button onClick={() => setShowThreadModal(true)} className="btn-primary">
                    + New thread
                  </button>
                </div>
                {discussions.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">No discussion threads started yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {discussions.map(thread => (
                      <div key={thread._id} onClick={() => setSelectedThread(thread)} className="flex items-center justify-between p-4 bg-[#161b22] border border-[#30363d] rounded-lg cursor-pointer hover:border-[#8b949e] transition-all group">
                        <div className="flex items-start gap-4">
                          <svg className="text-[#2ea043] mt-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          <div>
                            <h4 className="text-[15px] font-semibold text-white group-hover:text-[#58a6ff] transition-colors">{thread.title}</h4>
                            <div className="text-xs text-gray-500 mt-1 flex gap-2">
                              <span>{thread.creatorName}</span>
                              <span>·</span>
                              <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {thread.replies.length} replies
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-6">
                <button onClick={() => setSelectedThread(null)} className="text-sm text-gray-400 hover:text-white flex items-center gap-2 w-max">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back
                </button>
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col gap-6">
                  <div>
                    <span className="text-xs font-semibold text-[#58a6ff] bg-[#1f6feb]/10 px-2 py-1 rounded border border-[#1f6feb]/20">{selectedThread.category}</span>
                    <h3 className="text-xl font-bold text-white mt-3">{selectedThread.title}</h3>
                    <p className="text-xs text-gray-500 mt-2">Posted by {selectedThread.creatorName}</p>
                  </div>
                  <div className="h-px bg-[#30363d] w-full"></div>
                  <div className="flex flex-col gap-4">
                    {selectedThread.replies.map(reply => (
                      <div key={reply._id} className="flex gap-3 bg-[#0d1117] border border-[#30363d] p-4 rounded-lg">
                        <img src={reply.userAvatar} alt={reply.userName} className="w-8 h-8 rounded-full border border-[#30363d]" />
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-white">{reply.userName}</span>
                          <p className="text-sm text-gray-300">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handlePostReply} className="flex gap-3 mt-4">
                    <input type="text" className="flex-1 bg-[#0d1117] border border-[#30363d] text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[#58a6ff]" placeholder="Write a reply..." value={replyInput} onChange={(e) => setReplyInput(e.target.value)} required />
                    <button type="submit" className="btn-primary">Reply</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl flex flex-col justify-center">
                <span className="text-sm text-gray-400 mb-1">Total Spent</span>
                <div className="text-2xl font-bold text-[#f85149]">${totalExpenseSum.toFixed(2)}</div>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl flex flex-col justify-center relative">
                <span className="text-sm text-gray-400 mb-1">This Month</span>
                <div className="text-2xl font-bold text-[#d29922]">${(totalExpenseSum * 0.45).toFixed(2)}</div>
                <svg className="absolute right-5 top-1/2 -translate-y-1/2 text-[#d29922]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl flex flex-col justify-center relative">
                <span className="text-sm text-gray-400 mb-1">Per Member</span>
                <div className="text-2xl font-bold text-[#58a6ff]">${(totalExpenseSum / Math.max(1, project.members.length)).toFixed(2)}</div>
                <svg className="absolute right-5 top-1/2 -translate-y-1/2 text-[#58a6ff]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[#30363d] pb-4">
                <h3 className="text-lg font-bold text-white">Expense History</h3>
                <button onClick={() => setShowExpenseModal(true)} className="btn-secondary !text-xs !py-1.5">+ Add</button>
              </div>
              <div className="flex flex-col gap-2">
                {expenses.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No expenses recorded.</p>
                ) : (
                  expenses.map(expense => (
                    <div key={expense._id} className="flex items-center justify-between p-4 bg-[#0d1117] border border-[#30363d] rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-[#161b22] border border-[#30363d] flex items-center justify-center text-gray-500">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{expense.title}</h4>
                          <span className="text-xs text-gray-500">{new Date(expense.createdAt).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400 bg-[#161b22] border border-[#30363d] px-2 py-1 rounded">{expense.category}</span>
                        <span className="text-sm font-bold text-white">${expense.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board Tab */}
        {activeTab === 'kanban' && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white">Project Board</h3>
              <button onClick={() => setShowTaskModal(true)} className="btn-primary">
                + Add Task
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 items-start">
              {(['todo', 'in_progress', 'review', 'done'] as const).map(col => {
                const colTasks = tasks.filter(t => t.status === col);
                const colTitle = col === 'todo' ? 'To Do' : col === 'in_progress' ? 'In Progress' : col === 'review' ? 'In Review' : 'Done';
                const colColor = col === 'todo' ? '#8b949e' : col === 'in_progress' ? '#58a6ff' : col === 'review' ? '#d29922' : '#2ea043';
                const colBorderColor = col === 'todo' ? 'border-[#30363d]' : col === 'in_progress' ? 'border-[#1f6feb]/40' : col === 'review' ? 'border-[#9e6a03]/40' : 'border-[#2ea043]/40';
                const colBg = col === 'todo' ? 'bg-[#161b22]' : col === 'in_progress' ? 'bg-[#161b22]' : col === 'review' ? 'bg-[#161b22]' : 'bg-[#161b22]';
                return (
                  <div key={col} className={`${colBg} border ${colBorderColor} rounded-xl p-4 flex flex-col gap-3 min-h-[400px]`}>
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colColor }}></div>
                        <h4 className="text-sm font-semibold text-gray-200">{colTitle}</h4>
                      </div>
                      <span className="text-xs bg-[#0d1117] border border-[#30363d] text-gray-400 px-2 py-0.5 rounded-full font-mono">{colTasks.length}</span>
                    </div>
                    <div className="flex flex-col gap-2.5 flex-1">
                      {colTasks.map(task => (
                        <div key={task._id} className="bg-[#0d1117] border border-[#30363d] p-3 rounded-lg flex flex-col gap-2 hover:border-[#58a6ff]/50 hover:shadow-[0_0_0_1px_rgba(88,166,255,0.1)] transition-all cursor-move group">
                          <h5 className="text-sm font-semibold text-[#c9d1d9] leading-snug group-hover:text-white transition-colors">{task.title}</h5>
                          {task.description && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{task.description}</p>}
                          <div className="flex justify-between items-center mt-1">
                            <div className="flex items-center gap-2">
                              {task.assignedUserName && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-[#6e40c9] text-white flex items-center justify-center text-[9px] font-bold border border-[#30363d]">
                                    {task.assignedUserName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-[11px] text-gray-500">{task.assignedUserName.split(' ')[0]}</span>
                                </div>
                              )}
                              {task.dueDate && (
                                <span className="text-[10px] text-gray-600 bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
                                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {col !== 'todo' && <button onClick={() => handleMoveTask(task._id, col === 'in_progress' ? 'todo' : col === 'review' ? 'in_progress' : 'review')} className="text-gray-600 hover:text-white p-1 rounded hover:bg-[#30363d] transition-colors text-xs" title="Move back">&larr;</button>}
                              {col !== 'done' && <button onClick={() => handleMoveTask(task._id, col === 'todo' ? 'in_progress' : col === 'in_progress' ? 'review' : 'done')} className="text-gray-600 hover:text-[#58a6ff] p-1 rounded hover:bg-[#1f6feb]/10 transition-colors text-xs" title="Move forward">&rarr;</button>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#30363d] rounded-lg min-h-[80px]">
                          <p className="text-xs text-gray-600">No tasks</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vault Tab */}
        {activeTab === 'vault' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2 border-b border-[#30363d] pb-4">
              <h3 className="text-lg font-bold text-white">Project Vault</h3>
              <button onClick={() => setShowVaultModal(true)} className="btn-primary">+ Add link</button>
            </div>
            <div className="flex flex-col gap-3">
              {vaultLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-[#161b22] border border-[#30363d] rounded-lg hover:border-[#58a6ff] transition-colors group no-underline">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-gray-400 group-hover:text-[#58a6ff] transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={link.icon}></path></svg>
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-white group-hover:text-[#58a6ff] transition-colors">{link.name}</h4>
                      <span className="text-xs text-gray-500 truncate max-w-[280px] block">{link.url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 bg-[#0d1117] border border-[#30363d] px-2 py-1 rounded">{link.type}</span>
                    <svg className="text-gray-500 group-hover:text-[#58a6ff] transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6 p-6">
            <div>
              <h3 className="text-xl font-bold text-white">Review Teammates & Close Project</h3>
              <p className="text-sm text-gray-400 mt-1">Project completed! Rate your teammates to build their trust scores.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
              {/* Select Teammate */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col gap-3">
                <h4 className="text-base font-semibold text-white mb-2">Select Teammate to Review:</h4>
                {project.members
                  .filter(m => m._id !== user?._id)
                  .map(member => {
                    const isReviewed = reviewedTeammates.includes(member._id);
                    return (
                      <button
                        key={member._id}
                        onClick={() => { if (!isReviewed) setTargetReviewee(member); }}
                        className={`flex items-center justify-between gap-2.5 p-3 rounded-lg border ${targetReviewee?._id === member._id ? 'bg-[#1f6feb]/10 border-[#58a6ff] text-white' : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-[#8b949e]'} transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
                        disabled={isReviewed}
                      >
                        <div className="flex items-center gap-2">
                          <img src={member.avatarUrl} alt={member.name} className="w-6 h-6 rounded-full border border-[#30363d]" />
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                        {isReviewed && <span className="text-[#2ea043] text-xs font-bold">✓ Reviewed</span>}
                      </button>
                    );
                  })}
              </div>

              {/* Review Form */}
              {targetReviewee ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Submit Review for {targetReviewee.name}</h3>
                  
                  {reviewStatusText && (
                    <div className={`p-3 rounded-lg text-sm mb-4 border ${reviewStatusText.includes('successfully') ? 'bg-[#2ea043]/10 border-[#2ea043]/30 text-[#2ea043]' : 'bg-[#f85149]/10 border-[#f85149]/30 text-[#ff7b72]'}`}>
                      {reviewStatusText}
                    </div>
                  )}

                  <form onSubmit={handleSubmittingTeammateReview} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-400">Communication (1-5)</label>
                        <input type="number" min="1" max="5" className="bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-lg outline-none focus:border-[#58a6ff]" value={communication} onChange={(e) => setCommunication(Number(e.target.value))} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-400">Technical Skills (1-5)</label>
                        <input type="number" min="1" max="5" className="bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-lg outline-none focus:border-[#58a6ff]" value={technicalSkills} onChange={(e) => setTechnicalSkills(Number(e.target.value))} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-400">Reliability (1-5)</label>
                        <input type="number" min="1" max="5" className="bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-lg outline-none focus:border-[#58a6ff]" value={reliability} onChange={(e) => setReliability(Number(e.target.value))} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-400">Teamwork (1-5)</label>
                        <input type="number" min="1" max="5" className="bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-lg outline-none focus:border-[#58a6ff]" value={teamwork} onChange={(e) => setTeamwork(Number(e.target.value))} required />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Feedback Comments</label>
                      <textarea className="bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-lg outline-none focus:border-[#58a6ff]" rows={3} placeholder="Describe their work, strengths, areas for improvement..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                      <button type="button" onClick={() => setTargetReviewee(null)} className="btn-secondary">Cancel</button>
                      <button type="submit" className="btn-primary" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-500 text-sm text-center h-full min-h-[200px]">
                  Select a teammate on the left to start rating them.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6 w-full">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-[#58a6ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-[#8b949e]">Loading analytics...</span>
                </div>
              </div>
            ) : analyticsError ? (
              <div className="bg-[#3d2621] border border-[#9e6a03] rounded-lg p-4 text-[#ff7b72]">
                <p className="font-semibold">Error loading analytics</p>
                <p className="text-sm text-gray-400 mt-1">{analyticsError}</p>
                <button onClick={fetchAnalytics} className="mt-3 px-3 py-1.5 bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-[#58a6ff] text-xs rounded hover:bg-[#58a6ff]/20 transition-colors">
                  Retry
                </button>
              </div>
            ) : analyticsData?.analytics ? (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/40 transition-colors">
                    <div className="text-xs text-[#8b949e] font-semibold uppercase tracking-wide mb-2">Project Progress</div>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-white">{analyticsData.analytics.projectProgress}%</div>
                      <span className="text-[#58a6ff] text-xs">${analyticsData.analytics.totalExpenses.toFixed(0)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0d1117] rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#58a6ff] to-[#1f6feb]" style={{width: `${analyticsData.analytics.projectProgress}%`}}></div>
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/40 transition-colors">
                    <div className="text-xs text-[#8b949e] font-semibold uppercase tracking-wide mb-2">Task Completion</div>
                    <div className="text-2xl font-bold text-white">{analyticsData.analytics.taskCompletionRate}%</div>
                    <div className="text-xs text-[#8b949e] mt-2">{analyticsData.analytics.completedTasks} of {analyticsData.analytics.totalTasks} tasks</div>
                  </div>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/40 transition-colors">
                    <div className="text-xs text-[#8b949e] font-semibold uppercase tracking-wide mb-2">Team Activity</div>
                    <div className="text-2xl font-bold text-white">{analyticsData.analytics.teamActivityCount}</div>
                    <div className="text-xs text-[#8b949e] mt-2">actions this week</div>
                  </div>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/40 transition-colors">
                    <div className="text-xs text-[#8b949e] font-semibold uppercase tracking-wide mb-2">Expenses</div>
                    <div className="text-2xl font-bold text-[#79c0ff]">${analyticsData.analytics.totalExpenses.toFixed(2)}</div>
                    <div className="text-xs text-[#8b949e] mt-2">total spent</div>
                  </div>
                </div>

                {/* Task Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-white mb-4">📋 Task Status Distribution</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#2ea043'}}></div>
                          <span className="text-sm text-[#c9d1d9]">Done</span>
                        </div>
                        <span className="font-semibold text-white">{analyticsData.analytics.completedTasks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ff7b72'}}></div>
                          <span className="text-sm text-[#c9d1d9]">In Progress</span>
                        </div>
                        <span className="font-semibold text-white">{analyticsData.analytics.inProgressTasks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#58a6ff'}}></div>
                          <span className="text-sm text-[#c9d1d9]">To Do</span>
                        </div>
                        <span className="font-semibold text-white">{analyticsData.analytics.todoTasks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#d29922'}}></div>
                          <span className="text-sm text-[#c9d1d9]">In Review</span>
                        </div>
                        <span className="font-semibold text-white">{analyticsData.analytics.reviewTasks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-white mb-4">💬 Team Engagement</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded">
                        <span className="text-sm text-[#8b949e]">Discussions</span>
                        <span className="font-semibold text-[#79c0ff]">{analyticsData.analytics.discussionCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded">
                        <span className="text-sm text-[#8b949e]">Messages</span>
                        <span className="font-semibold text-[#79c0ff]">{analyticsData.analytics.messageCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded">
                        <span className="text-sm text-[#8b949e]">Team Members</span>
                        <span className="font-semibold text-[#79c0ff]">{project?.members.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Contributors */}
                {analyticsData.topContributors && analyticsData.topContributors.length > 0 && (
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-white mb-4">⭐ Top Contributors</h3>
                    <div className="space-y-2">
                      {analyticsData.topContributors.map((contributor: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-[#0d1117] rounded hover:bg-[#161b22] transition-colors">
                          <div className="w-6 h-6 rounded-full bg-[#30363d] flex items-center justify-center text-xs font-bold text-[#79c0ff]">
                            {idx + 1}
                          </div>
                          <img src={contributor.userId.avatarUrl} alt={contributor.userId.name} className="w-8 h-8 rounded-full border border-[#30363d]" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{contributor.userId.name}</div>
                            <div className="text-xs text-[#8b949e] truncate">@{contributor.userId.githubUsername}</div>
                          </div>
                          <div className="flex gap-3 text-xs text-[#8b949e]">
                            <span>✓ {contributor.tasksCompleted}</span>
                            <span>💬 {contributor.messagesCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Refresh */}
                <div className="flex gap-2">
                  <button onClick={fetchAnalytics} className="px-4 py-2 bg-[#1f6feb]/10 border border-[#1f6feb]/30 text-[#58a6ff] text-sm rounded-lg hover:bg-[#1f6feb]/20 transition-colors flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path></svg>
                    Refresh
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center">
                <p className="text-[#8b949e] text-sm">No analytics data available yet. Complete some tasks, create discussions, or log expenses to see analytics.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-lg rounded-2xl p-8 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">Create New Project Task</h2>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Task Title *</label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" placeholder="e.g. Design database schema" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Description</label>
                <textarea className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" rows={3} placeholder="Task details..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Assign To</label>
                <select className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}>
                  <option value="">-- Assign teammate --</option>
                  {project.members.map(member => (
                    <option key={member._id} value={member._id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Due Date</label>
                <input type="date" className="bg-[#0d1117] border border-[#30363d] text-gray-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingTask}>
                  {savingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thread Modal */}
      {showThreadModal && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-lg rounded-2xl p-8 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">Start Discussion Thread</h2>
            <form onSubmit={handleCreateThread} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Thread Title *</label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" placeholder="e.g. Database planning discussion" value={threadTitle} onChange={(e) => setThreadTitle(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Category</label>
                <select className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={threadCategory} onChange={(e) => setThreadCategory(e.target.value)}>
                  <option value="Planning">Planning</option>
                  <option value="Design">Design</option>
                  <option value="Bugs to Fix">Bugs to Fix</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowThreadModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingThread}>
                  {savingThread ? 'Creating...' : 'Start Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-lg rounded-2xl p-8 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">Log Project Expense</h2>
            <form onSubmit={handleLogExpense} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Expense Title *</label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" placeholder="e.g. Vercel Hosting" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Amount ($) *</label>
                <input type="number" step="0.01" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" placeholder="0.00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Category</label>
                <select className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                  <option value="Hosting">Hosting</option>
                  <option value="Domains">Domains</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Description</label>
                <textarea className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" rows={2} placeholder="Optional details..." value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loggingExpense}>
                  {loggingExpense ? 'Logging...' : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vault Link Modal */}
      {showVaultModal && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-lg rounded-2xl p-8 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">Add Vault Link</h2>
            <form onSubmit={handleAddVaultLink} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Link Name *</label>
                <input type="text" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" placeholder="e.g. GitHub Repository" value={vaultLinkName} onChange={(e) => setVaultLinkName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">URL *</label>
                <input type="url" className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" placeholder="https://..." value={vaultLinkUrl} onChange={(e) => setVaultLinkUrl(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Type</label>
                <select className="bg-[#0d1117] border border-[#30363d] text-white px-4 py-2.5 rounded-lg outline-none focus:border-[#58a6ff]" value={vaultLinkType} onChange={(e) => setVaultLinkType(e.target.value)}>
                  <option value="Code">Code</option>
                  <option value="Design">Design</option>
                  <option value="Docs">Docs</option>
                  <option value="Infra">Infra</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowVaultModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  Add Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
