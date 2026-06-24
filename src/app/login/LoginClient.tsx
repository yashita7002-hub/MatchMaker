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
    <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-80px)] relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#238636]/8 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#58a6ff]/6 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-sm flex flex-col gap-6 relative">
        {/* Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 flex flex-col gap-8 relative overflow-hidden shadow-2xl">
          {/* Top border accent */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#238636]/60 to-transparent" />

          {/* Header */}
          <div className="text-center flex flex-col items-center gap-4">
            {/* GitHub Logo */}
            <div className="w-14 h-14 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Welcome to ProjectMatch
              </h1>
              <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
                Sign in with your GitHub account to find teammates, pitch ideas, and collaborate.
              </p>
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="bg-[#f85149]/10 border border-[#f85149]/30 text-[#ff7b72] px-4 py-3 rounded-xl text-sm text-center leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* GitHub OAuth Button */}
          <div className="flex flex-col gap-3">
            <a
              href="/api/auth/login"
              id="github-signin-btn"
              className="group flex items-center justify-center gap-3 w-full px-5 py-3.5 bg-[#238636] hover:bg-[#2ea043] active:scale-[0.98] text-white font-semibold rounded-xl transition-all duration-200 border border-[rgba(255,255,255,0.1)] shadow-lg shadow-[#238636]/20"
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

            <p className="text-center text-xs text-gray-600 px-4 leading-relaxed">
              By signing in, you agree to our Terms of Service. We only request read access to your public GitHub profile.
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex justify-center gap-6 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-[#3fb950]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No passwords stored
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-[#3fb950]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Read-only GitHub access
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-[#3fb950]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Secure OAuth 2.0
          </span>
        </div>
      </div>
    </div>
  );
}
