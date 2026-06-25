"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const NOTIF_TYPE_LABEL: Record<string, string> = {
  invitation: 'Invitation',
  invitation_accepted: 'Invitation',
  application: 'Application',
  message: 'Message',
  task: 'Task',
  expense: 'Expense',
  deadline: 'Deadline',
  project_status: 'Project',
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, notifications, unreadCount, markNotificationsAsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationsAsRead();
  };

  const handleNotificationClick = async (notif: { _id: string; link: string; isRead: boolean }) => {
    if (!notif.isRead) await markNotificationsAsRead(notif._id);
    setShowNotifications(false);
    if (notif.link) router.push(notif.link);
  };

  const handleProtectedNav = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0d1117] border-b border-[#30363d] px-4 md:px-6 py-3 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-4 md:gap-6">
        <button 
          className="lg:hidden text-gray-400 hover:text-white" 
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
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

        <div className="hidden lg:flex items-center gap-4 ml-2">
          <Link href="/" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            Home
          </Link>
          <Link href="/dashboard" onClick={handleProtectedNav} className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname === '/dashboard' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            Explore
          </Link>
          {user && (
            <Link href={`/profile/${user.githubUsername}`} className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname.startsWith('/profile') ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}`}>
              Profile
            </Link>
          )}
          <Link href="/projects" onClick={handleProtectedNav} className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname === '/projects' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}`}>
            Project Page
          </Link>
          <Link href="/dashboard" onClick={handleProtectedNav} className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${pathname.includes('workspace') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            Team Hub
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="text-gray-400 hover:text-white transition-colors relative mt-1"
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {user && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[10px] h-2.5 px-0.5 bg-[#f85149] rounded-full border-2 border-[#0d1117] text-[8px] text-white font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {user && showNotifications && (
            <div className="absolute right-[-1rem] sm:right-0 mt-3 sm:mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-[#161b22] border border-[#30363d] sm:rounded-md shadow-2xl sm:shadow-lg py-2 z-[60]">
              <div className="px-4 py-2 border-b border-[#30363d] flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#58a6ff] hover:text-[#79c0ff]"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif._id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 border-b border-[#30363d]/50 hover:bg-[#21262d] cursor-pointer flex flex-col gap-1 ${!notif.isRead ? 'bg-[#58a6ff]/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#58a6ff]">
                            {NOTIF_TYPE_LABEL[notif.type] || notif.type}
                          </span>
                          <p className={`text-sm ${!notif.isRead ? 'text-white font-medium' : 'text-gray-300'}`}>
                            {notif.message}
                          </p>
                        </div>
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
              
              <div className="absolute right-0 mt-2 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-lg py-1 hidden group-hover:block">
                <div className="px-4 py-2 border-b border-[#30363d]">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">@{user.githubUsername}</p>
                </div>
                <Link href={`/profile/${user.githubUsername}`} className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0366d6] hover:text-white">
                  Your profile
                </Link>
                <Link href="/projects" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0366d6] hover:text-white">
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#0d1117]/95 backdrop-blur-sm lg:hidden flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-8">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-xl font-bold text-white">
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
            <button 
              className="text-gray-400 hover:text-white" 
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="flex flex-col gap-6">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`text-xl font-medium ${pathname === '/' ? 'text-white' : 'text-gray-400'}`}>
              Home
            </Link>
            <Link href="/dashboard" onClick={(e) => { handleProtectedNav(e); setMobileMenuOpen(false); }} className={`text-xl font-medium ${pathname === '/dashboard' ? 'text-white' : 'text-gray-400'}`}>
              Explore
            </Link>
            {user && (
              <Link href={`/profile/${user.githubUsername}`} onClick={() => setMobileMenuOpen(false)} className={`text-xl font-medium ${pathname.startsWith('/profile') ? 'text-white' : 'text-gray-400'}`}>
                Profile
              </Link>
            )}
            <Link href="/projects" onClick={(e) => { handleProtectedNav(e); setMobileMenuOpen(false); }} className={`text-xl font-medium ${pathname === '/projects' ? 'text-white' : 'text-gray-400'}`}>
              Project Page
            </Link>
            <Link href="/dashboard" onClick={(e) => { handleProtectedNav(e); setMobileMenuOpen(false); }} className={`text-xl font-medium ${pathname.includes('workspace') ? 'text-white' : 'text-gray-400'}`}>
              Team Hub
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
