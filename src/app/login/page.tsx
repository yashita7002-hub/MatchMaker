"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Login() {
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
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 70px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '2rem' }}>Welcome to <span className="text-gradient">Project Matchmaker</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Collaborate with students, build portfolios, and earn trust scores.</p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', color: '#f87171' }}>
            {errorMsg}
          </div>
        )}

      
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="/api/auth/login" className="btn-primary" style={{ justifyContent: 'center', padding: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            Sign in with GitHub
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-glass)' }} />
          <span>DEVELOPER MOCK LOGIN</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-glass)' }} />
        </div>

        {}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Enter any GitHub Username</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. torvalds"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ flex: 1 }}
                disabled={loading}
              />
              <button type="submit" className="btn-secondary" style={{ padding: '10px 16px' }} disabled={loading}>
                {loading ? '...' : 'Go'}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Fetches repositories from GitHub API (or uses mock details if offline/rate-limited).
            </span>
          </div>
        </form>

       
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quick select a tester persona:</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={() => handleQuickLogin('alex-dev')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px', justifyContent: 'center' }}>
              Alex (Frontend Wizard)
            </button>
            <button onClick={() => handleQuickLogin('sam-db')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px', justifyContent: 'center' }}>
              Sam (DB Architect)
            </button>
            <button onClick={() => handleQuickLogin('jordan-pm')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px', justifyContent: 'center' }}>
              Jordan (Product Manager)
            </button>
            <button onClick={() => handleQuickLogin('taylor-fs')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px', justifyContent: 'center' }}>
              Taylor (Fullstack Lead)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
