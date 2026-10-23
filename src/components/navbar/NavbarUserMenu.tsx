"use client";
import React from 'react';
import Link from 'next/link';
import { UserSummary } from '@/types';

interface NavbarUserMenuProps {
  user: UserSummary;
  onLogout: () => void;
}

export default function NavbarUserMenu({ user, onLogout }: NavbarUserMenuProps) {
  return (
    <div className="group relative">
      <button className="flex items-center p-0.5 rounded-full border border-white/15 hover:border-[#3b82f6]/50 transition-colors">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white flex items-center justify-center text-xs font-bold">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </button>

      <div className="absolute right-0 mt-2 w-52 bg-[#0b1326]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-1.5 hidden group-hover:block z-50">
        <div className="px-4 py-2.5 border-b border-white/10">
          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
          <p className="text-xs text-[#8c909f] truncate">@{user.githubUsername}</p>
        </div>
        <Link
          href={`/profile/${user.githubUsername}`}
          className="block px-4 py-2 text-sm text-[#c2c6d6] hover:bg-white/5 hover:text-white transition-colors"
        >
          Your profile
        </Link>
        <Link
          href="/dashboard"
          className="block px-4 py-2 text-sm text-[#c2c6d6] hover:bg-white/5 hover:text-white transition-colors"
        >
          Your projects
        </Link>
        <button
          onClick={onLogout}
          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
