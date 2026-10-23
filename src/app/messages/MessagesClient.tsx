"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ChatConversation, ChatMessage, ChatUser, PendingAttachment, SavedMessage } from '@/types';
import ConversationList from '@/components/chat/ConversationList';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import ChatHeader from '@/components/chat/ChatHeader';
import { useChatSocket } from '@/components/chat/useChatSocket';
import { uploadChatFile } from '@/lib/chat-upload-client';

export default function MessagesClient({
  initialConversationId,
  initialProjectId,
}: {
  initialConversationId: string;
  initialProjectId: string;
}) {
  const { user, loading: userLoading, globalSocket, markChatNotificationsAsRead } = useApp();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedType, setSelectedType] = useState<'direct' | 'group'>(initialProjectId ? 'group' : 'direct');
  const [selectedId, setSelectedId] = useState(initialProjectId || initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(Boolean(initialConversationId));
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typingName, setTypingName] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [desktopAlerts, setDesktopAlerts] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConversation = useMemo(
    () => conversations.find(c => c._id === selectedId && c.type === selectedType) || null,
    [conversations, selectedId, selectedType],
  );

  const otherUser = useMemo(
    () => activeConversation?.participants.find(p => p._id !== user?._id) || null,
    [activeConversation, user?._id],
  );

  const loadConversations = useCallback(async () => {
    const response = await fetch('/api/chat/conversations');
    if (!response.ok) throw new Error('Unable to load direct conversations');
    const data = await response.json();
    setConversations(data.conversations || []);
  }, []);

  const loadSaved = useCallback(async () => {
    const response = await fetch('/api/chat/saved');
    if (!response.ok) return;
    const data = await response.json();
    setSavedMessages(data.saved || []);
    setSavedIds((data.saved || []).map((item: SavedMessage) => item.messageId?._id).filter(Boolean));
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        await Promise.all([loadConversations(), loadSaved()]);
      } catch {
        if (active) setError('Could not load your messages. Please try again.');
      } finally {
        if (active) setLoadingConversations(false);
      }
    });
    return () => { active = false; };
  }, [loadConversations, loadSaved, user]);

  useEffect(() => {
    const query = searchText.trim();
    if (query.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/chat/conversations?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setSearchResults(data.users || []);
      } catch (searchError) {
        console.error(searchError);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  const loadMessages = useCallback(async (conversationId: string, type: 'direct' | 'group') => {
    const response = await fetch(type === 'group'
      ? `/api/workspace/${conversationId}/chat`
      : `/api/chat/conversations/${conversationId}/messages`);
    if (!response.ok) throw new Error('Unable to load messages');
    const data = await response.json();
    setMessages(data.messages || []);
    setConversations(prev => prev.map(c => c._id === conversationId ? { ...c, unreadCount: 0 } : c));
    if (type === 'group') {
      await markChatNotificationsAsRead({ projectId: conversationId });
      (data.messages || []).filter((m: ChatMessage) => m.userId !== user?._id).forEach((m: ChatMessage) => {
        globalSocket?.emit('project-message-read', { projectId: conversationId, messageId: m._id });
      });
    } else {
      await markChatNotificationsAsRead({ conversationId });
      globalSocket?.emit('direct-read', {
        conversationId,
        messageIds: (data.messages || []).filter((m: ChatMessage) => m.userId !== user?._id).map((m: ChatMessage) => m._id),
      });
    }
  }, [globalSocket, markChatNotificationsAsRead, user?._id]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void Promise.resolve().then(() => loadMessages(selectedId, selectedType))
      .catch(() => { if (active) setError('Could not open this conversation.'); })
      .finally(() => { if (active) setLoadingMessages(false); });
    window.history.replaceState(null, '', selectedType === 'group'
      ? `/messages?project=${encodeURIComponent(selectedId)}`
      : `/messages?conversation=${encodeURIComponent(selectedId)}`);
    globalSocket?.emit(selectedType === 'group' ? 'join-room' : 'join-conversation', selectedType === 'group'
      ? { projectId: selectedId }
      : { conversationId: selectedId });
    return () => { active = false; };
  }, [globalSocket, loadMessages, selectedId, selectedType]);

  useChatSocket({
    globalSocket,
    selectedId,
    selectedType,
    currentUserId: user?._id,
    desktopAlerts,
    loadMessages,
    loadConversations,
    setConversations,
    setMessages,
    setTypingName,
    setOnlineUserIds,
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingName]);

  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => {
      loadMessages(selectedId, selectedType).catch(console.error);
      loadConversations().catch(console.error);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadConversations, loadMessages, selectedId, selectedType]);

  const openConversation = async (conversationId: string, type: 'direct' | 'group' = 'direct') => {
    setError('');
    setShowSaved(false);
    setMessages([]);
    setTypingName('');
    setOnlineUserIds([]);
    setLoadingMessages(true);
    setSelectedId(conversationId);
    setSelectedType(type);
    setSearchText('');
    setSearchResults([]);
  };

  const startConversation = async (target: ChatUser) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target._id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to start conversation');
      await loadConversations();
      await openConversation(data.conversation._id);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Unable to start conversation');
    }
  };

  const emitNotifications = (notifs: Array<{ userId: string; _id: string }>) => {
    notifs.forEach(notification => globalSocket?.emit('notify-users', {
      userIds: [notification.userId],
      notification,
    }));
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || sending || (!messageText.trim() && selectedFiles.length === 0)) return;
    setSending(true);
    setError('');
    try {
      const attachments: PendingAttachment[] = [];
      for (const file of selectedFiles) {
        attachments.push(await uploadChatFile(file, selectedId, selectedType, setUploadProgress));
      }
      const endpoint = selectedType === 'group'
        ? `/api/workspace/${selectedId}/chat`
        : `/api/chat/conversations/${selectedId}/messages`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: messageText,
          attachmentIds: attachments.map(a => a.uploadId),
          replyToId: replyTo?._id,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send message');
      setMessages(prev => [...prev, data.message]);
      globalSocket?.emit(selectedType === 'group' ? 'send-message' : 'send-direct-message', selectedType === 'group'
        ? { projectId: selectedId, messageId: data.message._id }
        : { conversationId: selectedId, messageId: data.message._id });
      emitNotifications(data.notifications || []);
      setMessageText('');
      setSelectedFiles([]);
      setReplyTo(null);
      setUploadProgress('');
      await loadConversations();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message');
    } finally {
      setSending(false);
      setUploadProgress('');
    }
  };

  const updateMessage = async (message: ChatMessage, action: 'edit' | 'delete' | 'react', payload: Record<string, string>) => {
    try {
      const response = await fetch(`/api/chat/messages/${message._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Message update failed');
      setMessages(prev => prev.map(item => item._id === message._id ? data.message : item));
      globalSocket?.emit(selectedType === 'group' ? 'project-message-updated' : 'direct-message-updated', selectedType === 'group'
        ? { projectId: selectedId, messageId: message._id }
        : { conversationId: selectedId, messageId: message._id });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Message update failed');
    }
  };

  const toggleSaved = async (messageId: string) => {
    const saved = savedIds.includes(messageId);
    const response = await fetch(saved ? `/api/chat/saved?messageId=${messageId}` : '/api/chat/saved', {
      method: saved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: saved ? undefined : JSON.stringify({ messageId }),
    });
    if (!response.ok) {
      setError('Unable to update saved messages.');
      return;
    }
    setSavedIds(prev => saved ? prev.filter(id => id !== messageId) : [...prev, messageId]);
    await loadSaved();
  };

  const enableDesktopAlerts = async () => {
    if (!('Notification' in window)) {
      setError('Desktop notifications are not supported by this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    setDesktopAlerts(permission === 'granted');
  };

  const typeMessage = (value: string) => {
    setMessageText(value);
    if (!selectedId) return;
    globalSocket?.emit(selectedType === 'group' ? 'typing-indicator' : 'direct-typing', selectedType === 'group'
      ? { projectId: selectedId, isTyping: true }
      : { conversationId: selectedId, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      globalSocket?.emit(selectedType === 'group' ? 'typing-indicator' : 'direct-typing', selectedType === 'group'
        ? { projectId: selectedId, isTyping: false }
        : { conversationId: selectedId, isTyping: false });
    }, 700);
  };

  const downloadText = (message: ChatMessage) => {
    const blob = new Blob([message.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `message-${message._id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (userLoading) return <div className="flex-1 bg-[#020617]" />;
  if (!user) {
    return <div className="flex-1 bg-[#020617] p-8 text-center text-slate-300">Sign in to view your messages.</div>;
  }

  return (
    <div className="flex-1 bg-[#020617] px-4 py-7 md:px-8">
      <div className="mx-auto flex h-[calc(100vh-9rem)] min-h-[540px] max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#07101f]/90 shadow-2xl shadow-black/30">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-7">
          <div>
            <Link href="/dashboard" className="text-xs text-cyan-300 hover:text-cyan-200">← Dashboard</Link>
            <h1 className="mt-1 text-xl font-bold text-white">Messages</h1>
          </div>
          <button
            type="button"
            onClick={enableDesktopAlerts}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:border-cyan-400/40 hover:text-white"
          >
            {desktopAlerts ? 'Desktop alerts on' : 'Enable desktop alerts'}
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Conversation List Sidebar */}
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            selectedType={selectedType}
            currentUserId={user._id}
            onlineUserIds={onlineUserIds}
            loadingConversations={loadingConversations}
            searchText={searchText}
            searchResults={searchResults}
            showSaved={showSaved}
            savedMessages={savedMessages}
            savedIds={savedIds}
            onSearchChange={setSearchText}
            onSelectConversation={openConversation}
            onStartConversation={startConversation}
            onToggleShowSaved={() => setShowSaved(!showSaved)}
          />

          {/* Active Conversation Main Section */}
          <section className={`${selectedId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
            {!activeConversation ? (
              <div className="m-auto px-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-2xl text-cyan-300">✉</div>
                <p className="text-sm font-semibold text-white">Your conversations, in one place</p>
                <p className="mt-2 text-xs text-slate-500">Project group chats and private conversations.</p>
              </div>
            ) : (
              <>
                {/* Active Chat Header */}
                <ChatHeader
                  activeConversation={activeConversation}
                  selectedType={selectedType}
                  otherUser={otherUser}
                  onlineUserIds={onlineUserIds}
                  currentUserId={user._id}
                  showSaved={showSaved}
                  onBack={() => {
                    setSelectedId('');
                    setSelectedType('direct');
                    setMessages([]);
                    window.history.replaceState(null, '', '/messages');
                  }}
                  onToggleShowSaved={() => setShowSaved(!showSaved)}
                />

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto px-4 py-5 md:px-7">
                  {loadingMessages ? (
                    <p className="text-center text-xs text-slate-500">Loading messages…</p>
                  ) : messages.length === 0 ? (
                    <p className="mt-24 text-center text-xs text-slate-500">No messages yet. Say hello!</p>
                  ) : (
                    messages.map(message => (
                      <MessageBubble
                        key={message._id}
                        message={message}
                        currentUserId={user._id}
                        isSaved={savedIds.includes(message._id)}
                        onReply={setReplyTo}
                        onReact={(msg, emoji) => updateMessage(msg, 'react', { emoji })}
                        onToggleSave={toggleSaved}
                        onEdit={msg => {
                          const edited = window.prompt('Edit your message', msg.text);
                          if (edited !== null && edited.trim()) updateMessage(msg, 'edit', { text: edited });
                        }}
                        onDelete={msg => {
                          if (window.confirm('Delete this message for everyone?')) updateMessage(msg, 'delete', {});
                        }}
                        onDownloadText={downloadText}
                      />
                    ))
                  )}
                  {typingName && <p className="text-xs italic text-cyan-300">{typingName} is typing…</p>}
                  <div ref={scrollRef} />
                </div>

                {/* Chat Input Bar */}
                <ChatInput
                  messageText={messageText}
                  selectedFiles={selectedFiles}
                  sending={sending}
                  uploadProgress={uploadProgress}
                  error={error}
                  replyTo={replyTo}
                  onMessageChange={typeMessage}
                  onFilesChange={setSelectedFiles}
                  onCancelReply={() => setReplyTo(null)}
                  onSubmit={sendMessage}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
