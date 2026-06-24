"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginMock, loading } = useApp();
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (oauthError === 'oauth_not_configured') {
      setErrorMsg('GitHub OAuth is not configured. Please define GITHUB_CLIENT_ID in your .env, or use the Developer Mock Login below!');
    } else if (oauthError) {
      setErrorMsg(`Authentication failed: ${oauthError}`);
    }
  }, [oauthError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setErrorMsg('');
    const success = await loginMock(username);
    if (success) {
      router.push('/dashboard');
    } else {
      setErrorMsg('Failed to log in. Please check your network connection.');
    }
  };

  const handleQuickLogin = async (mockUser: string) => {
    setErrorMsg('');
    const success = await loginMock(mockUser);
    if (success) {
      router.push('/dashboard');
    } else {
      setErrorMsg(`Failed to log in as ${mockUser}`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-80px)] relative">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="glass-card w-full max-w-md p-8 sm:p-10 flex flex-col gap-8 relative overflow-hidden">
        {/* Subtle top border gradient highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="text-center flex flex-col gap-3">
          <h1 className="text-3xl font-heading font-extrabold text-white">
            Welcome to <br/>
            <span className="text-gradient leading-tight">Project Matchmaker</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Collaborate with students, build portfolios, and earn trust scores.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <a href="/api/auth/login" className="btn-primary w-full !py-4 text-[15px] group">
            <svg className="w-5 h-5 transition-transform group-hover:-rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            Sign in with GitHub
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Developer Mock Login</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Enter any GitHub Username</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
                placeholder="e.g. torvalds"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="btn-secondary !px-6" disabled={loading}>
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Go'}
              </button>
            </div>
            <span className="text-xs text-slate-500 mt-1 ml-1 leading-relaxed">
              Fetches repositories from GitHub API (or uses mock details if offline/rate-limited).
            </span>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Quick select a tester persona:</span>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleQuickLogin('alex-dev')} className="btn-secondary !text-xs !py-2.5 !px-2 line-clamp-1 break-all">
              Alex (Frontend)
            </button>
            <button onClick={() => handleQuickLogin('sam-db')} className="btn-secondary !text-xs !py-2.5 !px-2 line-clamp-1 break-all">
              Sam (Database)
            </button>
            <button onClick={() => handleQuickLogin('jordan-pm')} className="btn-secondary !text-xs !py-2.5 !px-2 line-clamp-1 break-all">
              Jordan (Product)
            </button>
            <button onClick={() => handleQuickLogin('taylor-fs')} className="btn-secondary !text-xs !py-2.5 !px-2 line-clamp-1 break-all">
              Taylor (Fullstack)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
