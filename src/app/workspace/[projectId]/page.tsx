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
      <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
        Loading team collaboration hub...
      </div>
    );
  }

  if (forbidden || !project) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', maxWidth: '500px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Access Forbidden</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>You are not authorized to view this private workspace. Hub workspace access is restricted to accepted team members only.</p>
          <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600 }}>PRIVATE WORKSPACE HUB</span>
          <h1 style={{ fontSize: '1.8rem', marginTop: '2px' }}>{project.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Teammates: {project.members.map(m => m.name).join(', ')}</p>
        </div>

        {}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
          
          {user?._id === project.ownerId._id && project.status !== 'Completed' && project.status !== 'Archived' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {project.status === 'Active' && (
                <button onClick={() => handleUpdateProjectStatus('Completed')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success)', boxShadow: 'none' }}>
                  Mark Completed
                </button>
              )}
              <button onClick={() => handleUpdateProjectStatus('Archived')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Archive
              </button>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        <button onClick={() => { setActiveTab('chat'); setSelectedThread(null); }} className={activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Team Chat
        </button>
        <button onClick={() => { setActiveTab('kanban'); setSelectedThread(null); }} className={activeTab === 'kanban' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Kanban Board
        </button>
        <button onClick={() => { setActiveTab('discussions'); setSelectedThread(null); }} className={activeTab === 'discussions' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Discussions
        </button>
        <button onClick={() => { setActiveTab('expenses'); setSelectedThread(null); }} className={activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Expenses (${totalExpenseSum})
        </button>
        {project.status === 'Completed' && (
          <button onClick={() => { setActiveTab('reviews'); setSelectedThread(null); }} className={activeTab === 'reviews' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            Review Teammates
          </button>
        )}
      </div>

      {}
      <div className="glass-panel" style={{ flex: 1, minHeight: '520px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
            {}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px' }}>
              {messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>No messages yet. Send a greeting to start collaborating!</p>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = user?.name === msg.senderName;
                  return (
                    <div key={msg._id || idx} style={{ display: 'flex', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                      <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{msg.senderName}</span>
                        <div style={{
                          background: isMe ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                          color: isMe ? '#ffffff' : 'var(--text-primary)',
                          padding: '10px 16px',
                          borderRadius: '16px',
                          borderTopLeftRadius: isMe ? '16px' : '4px',
                          borderTopRightRadius: isMe ? '4px' : '16px',
                          border: isMe ? 'none' : '1px solid var(--border-glass)',
                          fontSize: '0.9rem',
                          wordBreak: 'break-word',
                          boxShadow: isMe ? 'var(--accent-glow)' : 'none'
                        }}>
                          {msg.text}
                          {msg.imageUrl && (
                            <div style={{ marginTop: '8px' }}>
                              <img src={msg.imageUrl} alt="Attached screenshot" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {}
              {typingUser && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div className="typing-bubble">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '4px' }}>{typingUser} is typing</span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {}
            <form onSubmit={handleSendMessage} style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              
              {}
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: chatImageFile ? 'var(--accent-color)' : 'var(--text-secondary)' }} title="Attach an image">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setChatImageFile(e.target.files ? e.target.files[0] : null)}
                  style={{ display: 'none' }}
                />
              </label>
              
              {chatImageFile && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chatImageFile.name}
                </span>
              )}

              <input
                type="text"
                className="form-input"
                placeholder="Type your message here..."
                value={chatInput}
                onChange={handleChatInputChange}
                style={{ flex: 1 }}
                disabled={uploadingImage}
              />

              <button type="submit" className="btn-primary" style={{ padding: '10px 18px' }} disabled={uploadingImage || (!chatInput.trim() && !chatImageFile)}>
                {uploadingImage ? '...' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {}
        {activeTab === 'kanban' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Drag-and-Drop Task Management</h3>
              <button onClick={() => setShowTaskModal(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                + Add Task
              </button>
            </div>

            {}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', flex: 1 }}>
              {}
              {(['todo', 'in_progress', 'review', 'done'] as const).map(col => {
                const colTasks = tasks.filter(t => t.status === col);
                const colTitle = col === 'todo' ? 'To Do' : col === 'in_progress' ? 'In Progress' : col === 'review' ? 'In Review' : 'Done';
                
                return (
                  <div key={col} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '380px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '1rem' }}>{colTitle}</h4>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>{colTasks.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {colTasks.map(task => (
                        <div key={task._id} style={{ padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{task.title}</h5>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.description}</p>
                          
                          {task.assignedUserName && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>👤 {task.assignedUserName}</span>
                          )}
                          {task.dueDate && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📅 Due: {task.dueDate}</span>
                          )}

                          {}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
                            {col !== 'todo' && (
                              <button onClick={() => handleMoveTask(task._id, col === 'in_progress' ? 'todo' : col === 'review' ? 'in_progress' : 'review')} className="btn-secondary" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>←</button>
                            )}
                            {col !== 'done' && (
                              <button onClick={() => handleMoveTask(task._id, col === 'todo' ? 'in_progress' : col === 'in_progress' ? 'review' : 'done')} className="btn-secondary" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>→</button>
                            )}
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

        {}
        {activeTab === 'discussions' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {!selectedThread ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Team Discussions Board</h3>
                  <button onClick={() => setShowThreadModal(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    + Start Thread
                  </button>
                </div>

                {discussions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No discussion threads started yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {discussions.map(thread => (
                      <div key={thread._id} onClick={() => setSelectedThread(thread)} className="glass-panel-interactive" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600 }}>{thread.category}</span>
                          <h4 style={{ fontSize: '1.05rem', marginTop: '2px' }}>{thread.title}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created by: {thread.creatorName}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💬 {thread.replies.length} replies</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <button onClick={() => setSelectedThread(null)} className="btn-secondary" style={{ width: 'max-content', padding: '6px 12px', fontSize: '0.8rem' }}>
                  ← Back to Threads list
                </button>
                
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600 }}>{selectedThread.category}</span>
                    <h3 style={{ fontSize: '1.4rem' }}>{selectedThread.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created by: {selectedThread.creatorName}</span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

                  {}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedThread.replies.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No replies yet. Be the first to comment!</p>
                    ) : (
                      selectedThread.replies.map(reply => (
                        <div key={reply._id} style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '8px' }}>
                          <img src={reply.userAvatar} alt={reply.userName} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{reply.userName}</span>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{reply.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handlePostReply} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Write your reply..."
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      style={{ flex: 1 }}
                      required
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>Reply</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'expenses' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', flexWrap: 'wrap' }}>
              {}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Log New Expense</h3>
                <form onSubmit={handleLogExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Expense Title *</label>
                    <input type="text" className="form-input" placeholder="e.g. AWS bills, API costs" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount ($) *</label>
                    <input type="number" step="0.01" min="0.01" className="form-input" placeholder="0.00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                      <option value="Hosting">Hosting / Cloud</option>
                      <option value="AI API">AI API Costs</option>
                      <option value="Domain">Domain Registration</option>
                      <option value="SaaS Tool">SaaS Tool / Subscription</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description (optional)</label>
                    <input type="text" className="form-input" placeholder="Additional details..." value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={loggingExpense}>
                    {loggingExpense ? 'Logging...' : 'Log Expense'}
                  </button>
                </form>
              </div>

              {}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>Expense History</h3>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL SPENDING</span>
                    <h2 style={{ fontSize: '1.75rem', color: 'var(--accent-color)' }}>${totalExpenseSum.toFixed(2)}</h2>
                  </div>
                </div>

                {expenses.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No expenses logged for this project yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                    {expenses.map(expense => (
                      <div key={expense._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '12px 16px', borderRadius: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent-color)', borderRadius: '4px' }}>{expense.category}</span>
                          <h4 style={{ fontSize: '0.95rem', marginTop: '4px' }}>{expense.title}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged by: {expense.loggedBy}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>-${expense.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
