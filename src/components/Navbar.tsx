"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0d1117] border-b border-[#30363d] px-6 py-3 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-gray-300 transition-colors">
          <div className="bg-[#2ea043] p-1.5 rounded-md">
            <svg className="text-white" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span>ProjectMatch</span>
        </Link>

        {/* Search Bar */}
        <div className="relative hidden md:flex items-center">
          <svg className="absolute left-3 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search projects, users..." 
            className="bg-[#0d1117] border border-[#30363d] text-sm text-gray-300 rounded-md pl-9 pr-8 py-1.5 focus:outline-none focus:border-[#58a6ff] w-64 transition-colors"
          />
          <div className="absolute right-2 px-1.5 border border-[#30363d] rounded text-xs text-gray-500">
            /
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-4 ml-2">
          <Link href="/" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            Home
          </Link>
          <Link href="/dashboard" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname === '/dashboard' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            Explore
          </Link>
          {user && (
            <Link href={`/profile/${user.githubUsername}`} className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname.startsWith('/profile') ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}`}>
              Profile
            </Link>
          )}
          <Link href="/dashboard" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname.includes('/project') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            Project Page
          </Link>
          <Link href="/dashboard" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname.includes('workspace') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            Team Hub
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Bell Icon for Notifications */}
        <div className="relative group">
          <button className="text-gray-400 hover:text-white transition-colors relative mt-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {user && (useApp() as any).unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#f85149] rounded-full border-2 border-[#0d1117]"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {user && (
            <div className="absolute right-0 mt-2 w-80 bg-[#161b22] border border-[#30363d] rounded-md shadow-lg py-2 hidden group-hover:block z-50">
              <div className="px-4 py-2 border-b border-[#30363d] flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {(useApp() as any).unreadCount > 0 && (
                  <button 
                    onClick={() => (useApp() as any).markNotificationsAsRead()} 
                    className="text-xs text-[#58a6ff] hover:text-[#79c0ff]"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {((useApp() as any).notifications || []).length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center">No notifications</p>
                ) : (
                  ((useApp() as any).notifications || []).map((notif: any) => (
                    <div 
                      key={notif._id} 
                      onClick={() => {
                        (useApp() as any).markNotificationsAsRead(notif._id);
                        if (notif.link) router.push(notif.link);
                      }}
                      className={`px-4 py-3 border-b border-[#30363d]/50 hover:bg-[#21262d] cursor-pointer flex flex-col gap-1 ${!notif.isRead ? 'bg-[#58a6ff]/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notif.isRead ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {notif.message}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#58a6ff] mt-1.5 flex-shrink-0"></span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-primary !py-1.5 !px-3 !text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New
            </Link>
            
            <div className="group relative">
              <button className="flex items-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-[#30363d]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-xs font-bold border border-[#30363d]">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-lg py-1 hidden group-hover:block">
                <div className="px-4 py-2 border-b border-[#30363d]">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">@{user.githubUsername}</p>
                </div>
                <Link href={`/profile/${user.githubUsername}`} className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0366d6] hover:text-white">
                  Your profile
                </Link>
                <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0366d6] hover:text-white">
                  Your projects
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#0366d6] hover:text-white">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/login" className="btn-primary !py-1.5 !px-3 !text-sm">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
