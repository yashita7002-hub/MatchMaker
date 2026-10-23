"use client";
import React from 'react';
import { ChatConversation, ChatUser } from '@/types';

interface ChatHeaderProps {
  activeConversation: ChatConversation;
  selectedType: 'direct' | 'group';
  otherUser: ChatUser | null;
  onlineUserIds: string[];
  currentUserId: string;
  showSaved: boolean;
  onBack: () => void;
  onToggleShowSaved: () => void;
}

export default function ChatHeader({
  activeConversation,
  selectedType,
  otherUser,
  onlineUserIds,
  currentUserId,
  showSaved,
  onBack,
  onToggleShowSaved,
}: ChatHeaderProps) {
  const isGroup = selectedType === 'group';

  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
      <button
        className="mr-1 text-slate-400 md:hidden"
        onClick={onBack}
        aria-label="Back to conversations"
      >
        ←
      </button>

      {isGroup ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
          #
        </div>
      ) : (
        <img
          src={otherUser?.avatarUrl || 'https://github.com/ghost.png'}
          alt=""
          className="h-10 w-10 rounded-xl object-cover"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">
          {isGroup ? activeConversation.title : (otherUser?.name || 'Former member')}
        </p>
        <p className="text-[11px] text-slate-500">
          {isGroup
            ? `${onlineUserIds.filter(id => id !== currentUserId).length} teammates online · ${activeConversation.participants.length} members`
            : otherUser && onlineUserIds.includes(otherUser._id)
            ? 'Online'
            : `@${otherUser?.githubUsername || 'teammate'}`}
        </p>
      </div>

      <button
        onClick={onToggleShowSaved}
        className={`rounded-lg border border-white/10 px-3 py-2 text-[11px] transition-colors ${
          showSaved ? 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30' : 'text-slate-300 hover:text-cyan-200'
        }`}
      >
        Saved
      </button>
    </div>
  );
}
