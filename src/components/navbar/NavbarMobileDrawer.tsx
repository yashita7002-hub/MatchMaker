"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { UserSummary } from '@/types';

interface NavbarMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSummary | null;
  pathname: string;
  searchSection: string | null;
  onProtectedNav: (e: React.MouseEvent) => void;
  onLogout: () => void;
  onScrollTo?: (e: React.MouseEvent, id: string) => void;
}

export default function NavbarMobileDrawer({
  isOpen,
  onClose,
  user,
  pathname,
  searchSection,
  onProtectedNav,
  onLogout,
  onScrollTo,
}: NavbarMobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-[#020617]/95 backdrop-blur-3xl lg:hidden flex flex-col p-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-8">
        <Link
          href={user ? "/dashboard" : "/"}
          onClick={onClose}
          className="flex items-center gap-2.5 text-xl font-bold text-white"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] p-1.5 flex items-center justify-center">
            <svg
              className="text-white"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span>
            Project<span className="text-[#adc6ff]">Match</span>
          </span>
        </Link>
        <button
          className="text-[#c2c6d6] hover:text-white p-2 rounded-lg"
          onClick={onClose}
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {user ? (
        /* Authenticated Mobile Navigation */
        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard?pitch=true"
            onClick={(e) => {
              onClose();
              if (pathname === "/dashboard") {
                e.preventDefault();
                const url = new URL(window.location.href);
                url.searchParams.set("pitch", "true");
                window.history.pushState({}, "", url.toString());
                window.dispatchEvent(new CustomEvent("open-pitch-modal"));
              }
            }}
            className="text-lg font-bold p-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-lg shadow-blue-500/20"
          >
            <span>Pitch an Idea</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>

          <Link
            href="/dashboard?section=feed"
            onClick={onClose}
            className={`text-lg font-medium p-3 rounded-xl transition-all ${
              pathname === "/dashboard" && (!searchSection || searchSection === "feed")
                ? "text-white bg-white/10"
                : "text-[#c2c6d6]"
            }`}
          >
            Feed
          </Link>

          <Link
            href="/projects?section=my-projects"
            onClick={(e) => {
              onProtectedNav(e);
              onClose();
            }}
            className={`text-lg font-medium p-3 rounded-xl transition-all ${
              pathname === "/projects" || (pathname === "/dashboard" && searchSection === "my-projects")
                ? "text-white bg-white/10"
                : "text-[#c2c6d6]"
            }`}
          >
            Projects
          </Link>

          <Link
            href={`/profile/${user.githubUsername}`}
            onClick={onClose}
            className={`text-lg font-medium p-3 rounded-xl transition-all ${
              pathname.startsWith("/profile") ? "text-white bg-white/10" : "text-[#c2c6d6]"
            }`}
          >
            Profile
          </Link>

          <Link
            href="/dashboard?section=active-projects"
            onClick={(e) => {
              onProtectedNav(e);
              onClose();
            }}
            className={`text-lg font-medium p-3 rounded-xl transition-all ${
              pathname.includes("workspace") || (pathname === "/dashboard" && searchSection === "active-projects")
                ? "text-white bg-white/10"
                : "text-[#c2c6d6]"
            }`}
          >
            Team Hub
          </Link>

          <Link
            href="/messages"
            onClick={onClose}
            className={`text-lg font-medium p-3 rounded-xl transition-all ${
              pathname.startsWith("/messages") ? "text-white bg-white/10" : "text-[#c2c6d6]"
            }`}
          >
            Messages
          </Link>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="text-left text-lg font-medium p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all mt-4"
          >
            Sign out
          </button>
        </div>
      ) : (
        /* Public Visitor Mobile Navigation */
        <div className="flex flex-col gap-4">
          <a
            href="/#discover"
            onClick={(e) => onScrollTo && onScrollTo(e, "discover")}
            className="text-lg font-medium p-3 rounded-xl text-[#c2c6d6] hover:text-white hover:bg-white/5 transition-all"
          >
            Discover
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => onScrollTo && onScrollTo(e, "how-it-works")}
            className="text-lg font-medium p-3 rounded-xl text-[#c2c6d6] hover:text-white hover:bg-white/5 transition-all"
          >
            How It Works
          </a>
          <Link
            href="/login"
            onClick={onClose}
            className="btn-primary mt-4 !py-3 !text-center flex justify-center items-center gap-2"
          >
            <span>Wanna Join?</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
