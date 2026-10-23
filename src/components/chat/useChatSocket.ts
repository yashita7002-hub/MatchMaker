import { useEffect, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { ChatConversation, ChatMessage } from '@/types';

interface UseChatSocketOptions {
  globalSocket: Socket | null;
  selectedId: string;
  selectedType: 'direct' | 'group';
  currentUserId?: string;
  desktopAlerts: boolean;
  loadMessages: (conversationId: string, type: 'direct' | 'group') => Promise<void>;
  loadConversations: () => Promise<void>;
  setConversations: Dispatch<SetStateAction<ChatConversation[]>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setTypingName: Dispatch<SetStateAction<string>>;
  setOnlineUserIds: Dispatch<SetStateAction<string[]>>;
}

export function useChatSocket({
  globalSocket,
  selectedId,
  selectedType,
  currentUserId,
  desktopAlerts,
  loadMessages,
  loadConversations,
  setConversations,
  setMessages,
  setTypingName,
  setOnlineUserIds,
}: UseChatSocketOptions) {
  useEffect(() => {
    if (!globalSocket) return;

    const receiveDirectMessage = (message: ChatMessage) => {
      const isActive = selectedType === 'direct' && message.conversationId === selectedId;
      setConversations(prev => prev.map(c =>
        c.type === 'direct' && c._id === message.conversationId
          ? {
            ...c,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCount: isActive ? 0 : c.unreadCount + 1,
          }
          : c,
      ));
      if (isActive) {
        setMessages(prev => prev.some(item => item._id === message._id) ? prev : [...prev, message]);
        loadMessages(selectedId, selectedType).then(() => loadConversations()).catch(console.error);
      } else {
        loadConversations().catch(console.error);
      }
      if (document.hidden && desktopAlerts && 'Notification' in window && Notification.permission === 'granted' && message.userId !== currentUserId) {
        new Notification(message.senderName, { body: message.text || 'Sent an attachment', icon: message.senderAvatar });
      }
    };

    const receiveProjectMessage = (message: ChatMessage) => {
      const isActive = selectedType === 'group' && message.projectId === selectedId;
      setConversations(prev => prev.map(c =>
        c.type === 'group' && c.projectId === message.projectId
          ? {
            ...c,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCount: isActive ? 0 : c.unreadCount + 1,
          }
          : c,
      ));
      if (isActive) {
        setMessages(prev => prev.some(item => item._id === message._id) ? prev : [...prev, message]);
        loadMessages(selectedId, selectedType).then(() => loadConversations()).catch(console.error);
      } else {
        loadConversations().catch(console.error);
      }
    };

    const updateMessage = (message: ChatMessage) => {
      setMessages(prev => prev.map(item => item._id === message._id ? message : item));
    };

    const onTyping = (update: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (update.conversationId === selectedId && update.userId !== currentUserId) {
        setTypingName(update.isTyping ? update.userName : '');
      }
    };

    const onProjectTyping = (update: { projectId: string; userName: string; isTyping: boolean }) => {
      if (selectedType === 'group' && update.projectId === selectedId) {
        setTypingName(update.isTyping ? update.userName : '');
      }
    };

    const onPresence = (update: { conversationId: string; onlineUserIds: string[] }) => {
      if (selectedType === 'direct' && update.conversationId === selectedId) {
        setOnlineUserIds(update.onlineUserIds);
      }
    };

    const onProjectPresence = (update: { projectId: string; onlineUserIds: string[] }) => {
      if (selectedType === 'group' && update.projectId === selectedId) {
        setOnlineUserIds(update.onlineUserIds);
      }
    };

    const onOnline = ({ userId, conversationId, projectId }: { userId: string; conversationId?: string; projectId?: string }) => {
      if ((selectedType === 'direct' && conversationId === selectedId) || (selectedType === 'group' && projectId === selectedId)) {
        setOnlineUserIds(prev => prev.includes(userId) ? prev : [...prev, userId]);
      }
    };

    const onOffline = ({ userId, conversationId, projectId }: { userId: string; conversationId?: string; projectId?: string }) => {
      if ((selectedType === 'direct' && conversationId === selectedId) || (selectedType === 'group' && projectId === selectedId)) {
        setOnlineUserIds(prev => prev.filter(id => id !== userId));
      }
    };

    globalSocket.on('receive-direct-message', receiveDirectMessage);
    globalSocket.on('receive-message', receiveProjectMessage);
    globalSocket.on('direct-message-updated', updateMessage);
    globalSocket.on('project-message-updated', updateMessage);
    globalSocket.on('direct-typing', onTyping);
    globalSocket.on('typing-update', onProjectTyping);
    globalSocket.on('conversation-presence', onPresence);
    globalSocket.on('project-presence', onProjectPresence);
    globalSocket.on('user-online', onOnline);
    globalSocket.on('user-offline', onOffline);

    return () => {
      globalSocket.off('receive-direct-message', receiveDirectMessage);
      globalSocket.off('receive-message', receiveProjectMessage);
      globalSocket.off('direct-message-updated', updateMessage);
      globalSocket.off('project-message-updated', updateMessage);
      globalSocket.off('direct-typing', onTyping);
      globalSocket.off('typing-update', onProjectTyping);
      globalSocket.off('conversation-presence', onPresence);
      globalSocket.off('project-presence', onProjectPresence);
      globalSocket.off('user-online', onOnline);
      globalSocket.off('user-offline', onOffline);
    };
  }, [
    desktopAlerts,
    globalSocket,
    loadConversations,
    loadMessages,
    selectedId,
    selectedType,
    currentUserId,
    setConversations,
    setMessages,
    setTypingName,
    setOnlineUserIds,
  ]);
}
