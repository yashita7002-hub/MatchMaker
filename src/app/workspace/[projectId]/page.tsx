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
  
  const [activeTab, setActiveTab] = useState<'chat' | 'kanban' | 'discussions' | 'expenses' | 'reviews'>('chat');
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

  
  const [targetReviewee, setTargetReviewee] = useState<User | null>(null);
  const [communication, setCommunication] = useState(5);
  const [technicalSkills, setTechnicalSkills] = useState(5);
  const [reliability, setReliability] = useState(5);
  const [teamwork, setTeamwork] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedTeammates, setReviewedTeammates] = useState<string[]>([]);
  const [reviewStatusText, setReviewStatusText] = useState('');

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
        socketRef.current?.emit('expense-update', { projectId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingExpense(false);
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
        {(['chat', 'kanban', 'discussions', 'vault', 'expenses'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as any); setSelectedThread(null); }}
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
             <><span className="font-bold">$</span> Expenses</>}
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
        {activeTab === 'expenses' as any && (
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
                <button className="btn-secondary !text-xs !py-1.5">+ Add</button>
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
                return (
                  <div key={col} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col gap-3 min-h-[400px]">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-gray-300">{colTitle}</h4>
                      <span className="text-xs bg-[#0d1117] border border-[#30363d] text-gray-400 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>
                    <div className="flex flex-col gap-3 flex-1">
                      {colTasks.map(task => (
                        <div key={task._id} className="bg-[#0d1117] border border-[#30363d] p-3 rounded-lg flex flex-col gap-2 hover:border-[#8b949e] transition-colors cursor-move">
                          <h5 className="text-sm font-bold text-white leading-tight">{task.title}</h5>
                          {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}
                          <div className="flex justify-between items-center mt-1">
                            {task.assignedUserName && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-[10px] font-bold">
                                  {task.assignedUserName.substring(0, 2).toUpperCase()}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-1 ml-auto">
                              {col !== 'todo' && <button onClick={() => handleMoveTask(task._id, col === 'in_progress' ? 'todo' : col === 'review' ? 'in_progress' : 'review')} className="text-gray-500 hover:text-white p-1 bg-[#161b22] rounded">&larr;</button>}
                              {col !== 'done' && <button onClick={() => handleMoveTask(task._id, col === 'todo' ? 'in_progress' : col === 'in_progress' ? 'review' : 'done')} className="text-gray-500 hover:text-white p-1 bg-[#161b22] rounded">&rarr;</button>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vault Tab */}
        {activeTab === 'vault' as any && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2 border-b border-[#30363d] pb-4">
              <h3 className="text-lg font-bold text-white">Project Vault</h3>
              <button className="btn-primary">+ Add link</button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { name: 'GitHub Repository', url: 'https://github.com/org/repo', type: 'Code', icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' },
                { name: 'Figma Design Files', url: 'https://figma.com/file/xyz', type: 'Design', icon: 'M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM12 2h3.5a3.5 3.5 0 1 1 0 7H12V2zM5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5zM12 9h3.5a3.5 3.5 0 1 1 0 7H12V9zM8.5 16A3.5 3.5 0 1 1 12 19.5V16H8.5z' },
                { name: 'Pitch Deck', url: 'https://docs.google.com/presentation', type: 'Docs', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
                { name: 'AWS S3 Bucket', url: 'https://aws.amazon.com/s3', type: 'Infra', icon: 'M2 12l10-7 10 7-10 7-10-7z M2 17l10 7 10-7 M2 7l10 7 10-7' }
              ].map((link, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#161b22] border border-[#30363d] rounded-lg cursor-pointer hover:border-[#8b949e] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={link.icon}></path></svg>
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-white group-hover:text-[#58a6ff] transition-colors">{link.name}</h4>
                      <span className="text-xs text-gray-500">{link.url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 bg-[#0d1117] border border-[#30363d] px-2 py-1 rounded">{link.type}</span>
                    <svg className="text-gray-500 group-hover:text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {activeTab === 'reviews' && (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3>Review Teammates & Close Project</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Project completed! Rate your teammates to build their trust scores.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', flexWrap: 'wrap' }}>
              {}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>Select Teammate to Review:</h4>
                {project.members
                  .filter(m => m._id !== user?._id)
                  .map(member => {
                    const isReviewed = reviewedTeammates.includes(member._id);
                    return (
                      <button
                        key={member._id}
                        onClick={() => { if (!isReviewed) setTargetReviewee(member); }}
                        className={targetReviewee?._id === member._id ? 'btn-primary' : 'btn-secondary'}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', justifyContent: 'space-between' }}
                        disabled={isReviewed}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={member.avatarUrl} alt={member.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                          <span>{member.name}</span>
                        </div>
                        {isReviewed && <span style={{ color: 'var(--success)' }}>✓ Reviewed</span>}
                      </button>
                    );
                  })}
              </div>

              {}
              {targetReviewee ? (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Submit Review for {targetReviewee.name}</h3>
                  
                  {reviewStatusText && (
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '12px' }}>
                      {reviewStatusText}
                    </div>
                  )}

                  <form onSubmit={handleSubmittingTeammateReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Communication (1-5)</label>
                        <input type="number" min="1" max="5" className="form-input" value={communication} onChange={(e) => setCommunication(Number(e.target.value))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Technical Skills (1-5)</label>
                        <input type="number" min="1" max="5" className="form-input" value={technicalSkills} onChange={(e) => setTechnicalSkills(Number(e.target.value))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Reliability (1-5)</label>
                        <input type="number" min="1" max="5" className="form-input" value={reliability} onChange={(e) => setReliability(Number(e.target.value))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Teamwork (1-5)</label>
                        <input type="number" min="1" max="5" className="form-input" value={teamwork} onChange={(e) => setTeamwork(Number(e.target.value))} required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Feedback Comments</label>
                      <textarea className="form-textarea" rows={3} placeholder="Describe their work, strengths, areas for improvement..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button type="button" onClick={() => setTargetReviewee(null)} className="btn-secondary">Cancel</button>
                      <button type="submit" className="btn-primary" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', height: '100%' }}>
                  Select a teammate on the left to start rating them.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {}
      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2>Create New Project Task</h2>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Design database schema" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Task details..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}>
                  <option value="">-- Assign teammate --</option>
                  {project.members.map(member => (
                    <option key={member._id} value={member._id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingTask}>
                  {savingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showThreadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2>Start Discussion Thread</h2>
            <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Thread Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Database planning discussion" value={threadTitle} onChange={(e) => setThreadTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={threadCategory} onChange={(e) => setThreadCategory(e.target.value)}>
                  <option value="Planning">Planning</option>
                  <option value="Design">Design</option>
                  <option value="Bugs to Fix">Bugs to Fix</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowThreadModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingThread}>
                  {savingThread ? 'Start Thread' : 'Creating...'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
