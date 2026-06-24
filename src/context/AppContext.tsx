"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  loginMock: (username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationsAsRead: (id?: string) => Promise<void>;
  globalSocket: Socket | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    refreshUser();
  }, []);

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications(user._id);

      if (!socketRef.current) {
        socketRef.current = io();
      }
      
      socketRef.current.emit('register-global', { userId: user._id });

      const handleNewNotification = (notification: NotificationItem) => {
        setNotifications(prev => [notification, ...prev]);
      };

      socketRef.current.on('new-notification', handleNewNotification);

      return () => {
        if (socketRef.current) {
          socketRef.current.off('new-notification', handleNewNotification);
          // Only disconnect if we really want to tear down the socket when user changes, but usually we don't unmount AppProvider
        }
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
    }
  }, [user]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginMock = async (username: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Mock login failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const markNotificationsAsRead = async (id?: string) => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user._id
        },
        body: JSON.stringify(id ? { notificationId: id } : {})
      });
      
      setNotifications(prev => prev.map(n => 
        (id ? n._id === id : true) ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider value={{ 
      user, loading, theme, toggleTheme, loginMock, logout, refreshUser,
      notifications, unreadCount, markNotificationsAsRead, globalSocket: socketRef.current
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
