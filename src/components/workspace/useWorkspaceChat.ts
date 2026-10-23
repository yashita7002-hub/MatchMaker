"use client";
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, WorkspaceUser } from './WorkspaceTypes';

interface UseWorkspaceChatProps {
  projectId: string;
  user: WorkspaceUser | null;
  onRefreshWorkspace: () => void;
  onTasksUpdate: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useWorkspaceChat({
  projectId,
  user,
  onRefreshWorkspace,
  onTasksUpdate,
}: UseWorkspaceChatProps) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [chatReplyTo, setChatReplyTo] = useState<Message | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [chatUploadProgress, setChatUploadProgress] = useState('');
  const [chatError, setChatError] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;

    socketRef.current = io();
    socketRef.current.emit('join-room', { projectId });

    socketRef.current.on('receive-message', (message: Message) => {
      setMessages(prev => prev.some(existing => existing._id === message._id) ? prev : [...prev, message]);
      fetch(`/api/workspace/${projectId}/chat/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: message._id }),
      }).then(async response => {
        if (!response.ok) return;
        const data = await response.json();
        setMessages(prev => prev.map(existing => existing._id === message._id ? data.message : existing));
        socketRef.current?.emit('project-message-read', { projectId, messageId: message._id });
      }).catch(error => console.error('Unable to mark message read:', error));
    });

    socketRef.current.on('project-message-updated', (message: Message) => {
      setMessages(prev => prev.map(existing => existing._id === message._id ? message : existing));
    });

    socketRef.current.on('typing-update', ({ userName, isTyping }) => {
      setTypingUser(isTyping ? userName : '');
    });

    socketRef.current.on('kanban-update', ({ taskId, newStatus }) => {
      onTasksUpdate(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    });

    socketRef.current.on('expense-refresh', () => {
      onRefreshWorkspace();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive-message');
        socketRef.current.off('project-message-updated');
        socketRef.current.off('typing-update');
        socketRef.current.off('kanban-update');
        socketRef.current.off('expense-refresh');
        socketRef.current.disconnect();
      }
    };
  }, [user, projectId, onRefreshWorkspace, onTasksUpdate]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUser]);

  const uploadChatFile = (file: File): Promise<{
    uploadId: string;
    fileName: string;
    mimeType: string;
    size: number;
  }> => new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    const request = new XMLHttpRequest();
    request.open('POST', '/api/chat/upload');
    request.withCredentials = true;
    request.upload.onprogress = event => {
      if (event.lengthComputable) setChatUploadProgress(`${file.name} · ${Math.round(event.loaded / event.total * 100)}%`);
    };
    request.onerror = () => reject(new Error(`Upload failed for ${file.name}`));
    request.onload = () => {
      const data = JSON.parse(request.responseText || '{}');
      if (request.status >= 200 && request.status < 300) resolve(data.attachment);
      else reject(new Error(data.error || `Upload failed for ${file.name}`));
    };
    request.send(formData);
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && chatFiles.length === 0) return;

    try {
      setChatError('');
      setUploadingImage(true);
      const attachments: Array<{ uploadId: string; fileName: string; mimeType: string; size: number }> = [];
      for (const file of chatFiles) attachments.push(await uploadChatFile(file));

      const res = await fetch(`/api/workspace/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chatInput,
          attachmentIds: attachments.map(attachment => attachment.uploadId),
          replyToId: chatReplyTo?._id,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        socketRef.current?.emit('send-message', { projectId, messageId: json.message._id });
        setMessages(prev => [...prev, json.message]);

        json.notifications?.forEach((notif: { userId: string; _id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string }) => {
          socketRef.current?.emit('notify-users', { userIds: [notif.userId], notification: notif });
        });
        
        setChatInput('');
        setChatFiles([]);
        setChatReplyTo(null);
        setChatUploadProgress('');
        socketRef.current?.emit('typing-indicator', { projectId, userName: user?.name, isTyping: false });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Unable to send message');
      }
    } catch (err) {
      console.error('Chat message send failed:', err);
      setChatError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setUploadingImage(false);
      setChatUploadProgress('');
    }
  };

  const updateProjectMessage = async (message: Message, action: 'edit' | 'delete' | 'react', payload: Record<string, string>) => {
    try {
      setChatError('');
      const response = await fetch(`/api/chat/messages/${message._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update message');
      setMessages(previous => previous.map(item => item._id === message._id ? data.message : item));
      socketRef.current?.emit('project-message-updated', { projectId, messageId: message._id });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unable to update message');
    }
  };

  const saveProjectMessage = async (messageId: string) => {
    try {
      const response = await fetch('/api/chat/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Unable to save message');
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unable to save message');
    }
  };

  const downloadMessageText = (msg: Message) => {
    const blob = new Blob([msg.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${msg._id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit('typing-indicator', { projectId, userName: user?.name, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing-indicator', { projectId, userName: user?.name, isTyping: false });
      }, 2000);
    }
  };

  return {
    socketRef,
    messages,
    setMessages,
    typingUser,
    chatInput,
    chatFiles,
    chatReplyTo,
    uploadingImage,
    chatUploadProgress,
    chatError,
    chatBottomRef,
    setChatFiles,
    setChatReplyTo,
    handleChatInputChange,
    handleSendMessage,
    updateProjectMessage,
    saveProjectMessage,
    downloadMessageText,
  };
}
