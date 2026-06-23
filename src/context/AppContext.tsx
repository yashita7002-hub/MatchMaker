"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  loginMock: (username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  
  useEffect(() => {
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    
    refreshUser();
  }, []);

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

  return (
    <AppContext.Provider value={{ user, loading, theme, toggleTheme, loginMock, logout, refreshUser }}>
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
