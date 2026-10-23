"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useApp();
  const [errorMsg, setErrorMsg] = useState('');

  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (oauthError === 'oauth_not_configured') {
      setErrorMsg('GitHub OAuth is not configured on this server. Please contact the administrator.');
    } else if (oauthError) {
      setErrorMsg(`Authentication failed: ${oauthError}`);
    }
  }, [oauthError]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[calc(100vh-80px)] relative overflow-hidden">
      {/* Background Cosmic Glows */}
      <div className="cosmic-particle bg-[#3b82f6]/20 w-[500px] h-[500px] -top-32 -left-20 animate-pulse pointer-events-none" />
      <div className="cosmic-particle bg-[#8b5cf6]/20 w-[420px] h-[420px] -bottom-20 -right-20 animate-pulse pointer-events-none delay-1000" />
      <div className="cosmic-particle bg-[#06b6d4]/10 w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <main className="w-full max-w-md z-10 my-auto">
        {/* Authentication Glass Card */}
        <div className="glass-card rounded-[28px] p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden bg-[#0b1326]/65 backdrop-blur-2xl">
          {/* Subtle Top Stroke Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3b82f6]/80 to-transparent pointer-events-none" />

          {/* Header & Brand Icon */}
          <div className="text-center flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 border border-white/10 flex items-center justify-center shadow-xl shadow-[#3b82f6]/10">
              <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Welcome to <span className="hero-gradient">ProjectMatch</span>
              </h1>
              <p className="text-[#c2c6d6] text-sm mt-2 leading-relaxed">
                Connect with developer peers, pitch project ideas, and form elite hackathon or startup teams.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl text-xs text-center leading-relaxed backdrop-blur-md">
              {errorMsg}
            </div>
          )}

          {/* GitHub OAuth Button */}
          <div className="flex flex-col gap-4">
            <a
              href="/api/auth/login"
              id="github-signin-btn"
              className="group flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white font-bold text-sm tracking-wide shadow-xl shadow-[#3b82f6]/25 hover:shadow-[#3b82f6]/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 border border-white/10"
            >
              <svg
                className="w-5 h-5 transition-transform group-hover:-rotate-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </a>

            <p className="text-center text-xs text-[#8c909f] px-2 leading-relaxed">
              By continuing, you agree to ProjectMatch's Terms of Service. We only request read access to your public GitHub profile and repositories.
            </p>
          </div>

          {/* Trust Dividers */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#8c909f]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              No passwords stored
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
              Read-only GitHub sync
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"></span>
              OAuth 2.0 secure
            </span>
          </div>
        </div>

        {/* System Status Footnote */}
        <div className="mt-6 flex justify-between items-center text-[#8c909f]/60 text-xs px-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse"></span>
            <span>SYSTEMS NOMINAL</span>
          </div>
          <span className="font-mono text-[10px]">v2.4.0-STABLE</span>
        </div>
      </main>
    </div>
  );
}
