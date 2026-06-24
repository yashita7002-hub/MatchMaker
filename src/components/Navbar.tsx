"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, theme, toggleTheme, logout } = useApp();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center transition-all duration-300">
      <Link href="/" className="flex items-center gap-2 text-2xl font-heading font-extrabold group">
        <svg className="text-indigo-500 group-hover:scale-110 transition-transform" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">PMatchmaker</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/" className={`text-sm font-medium transition-colors hover:text-white ${pathname === '/' ? 'text-white' : 'text-slate-400'}`}>
          Discover
        </Link>
        
        {user && (
          <>
            <Link href="/dashboard" className={`text-sm font-medium transition-colors hover:text-white ${pathname === '/dashboard' ? 'text-white' : 'text-slate-400'}`}>
              Dashboard
            </Link>
            <Link href={`/profile/${user.githubUsername}`} className={`text-sm font-medium transition-colors hover:text-white ${pathname.startsWith('/profile') ? 'text-white' : 'text-slate-400'}`}>
              My Profile
            </Link>
          </>
        )}

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors" aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-3 ml-2 border-l border-white/10 pl-6">
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-white/20" />
            <button onClick={handleLogout} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn-primary ml-2 !py-2 !px-5 !text-sm">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
