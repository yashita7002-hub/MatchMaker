"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export interface UserProfile {
  _id: string;
  githubUsername: string;
  name: string;
  avatarUrl: string;
  bio: string;
  status: 'Available' | 'Busy' | 'Looking for Team' | 'Looking for Projects';
  skills: string[];
  roles: string[];
  trustScore: number;
  reviewsCount: number;
  repositories: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    url: string;
  }>;
}

export interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationsAsRead: (id?: string) => Promise<void>;
  markChatNotificationsAsRead: (target: { conversationId?: string; projectId?: string }) => Promise<void>;
  globalSocket: Socket | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [globalSocket, setGlobalSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    refreshUser();
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`Unable to load notifications (${res.status})`);
      const data: { notifications?: NotificationItem[] } = await res.json();
      const fetchedNotifications = data.notifications || [];
      setNotifications(previous => {
        const byId = new Map(previous.map(notification => [notification._id, notification]));
        fetchedNotifications.forEach(notification => byId.set(notification._id, notification));
        return Array.from(byId.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 50);
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (!socketRef.current) {
        socketRef.current = io();
        setGlobalSocket(socketRef.current);
      }
      const socket = socketRef.current;
      const registerGlobal = () => socket.emit('register-global');
      if (socket.connected) registerGlobal();
      socket.on('connect', registerGlobal);

      const handleNewNotification = (notification: NotificationItem) => {
        setNotifications(previous => [
          notification,
          ...previous.filter(existing => existing._id !== notification._id),
        ].slice(0, 50));
      };

      socket.on('new-notification', handleNewNotification);

      return () => {
        socket.off('connect', registerGlobal);
        socket.off('new-notification', handleNewNotification);
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setGlobalSocket(null);
      }
      setNotifications([]);
    }
  }, [user, refreshNotifications]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          void refreshNotifications();
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const markNotificationsAsRead = async (id?: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(id ? { notificationId: id } : {})
      });
      if (!response.ok) throw new Error(`Unable to update notifications (${response.status})`);
      
      setNotifications(prev => prev.map(n => 
        (id ? n._id === id : true) ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const markChatNotificationsAsRead = useCallback(async (target: { conversationId?: string; projectId?: string }) => {
    if (!user) return;
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target),
      });
      if (!response.ok) throw new Error('Unable to update chat notifications');
      setNotifications(previous => {
        let changed = false;
        const next = previous.map(notification => {
          const matchesConversation = target.conversationId
            && notification.link === `/messages?conversation=${target.conversationId}`;
          const matchesProject = target.projectId
            && notification.link.startsWith(`/workspace/${target.projectId}`);
          if (!notification.isRead && (matchesConversation || matchesProject)) {
            changed = true;
            return { ...notification, isRead: true };
          }
          return notification;
        });
        return changed ? next : previous;
      });
    } catch (error) {
      console.error('Failed to mark chat notifications as read:', error);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider value={{ 
      user, loading, theme, toggleTheme, logout, refreshUser,
    notifications, unreadCount, refreshNotifications, markNotificationsAsRead, markChatNotificationsAsRead, globalSocket
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
