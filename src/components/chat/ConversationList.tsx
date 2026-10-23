"use client";
import React from 'react';
import { ChatConversation, ChatUser, SavedMessage } from '@/types';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedId: string;
  selectedType: 'direct' | 'group';
  currentUserId?: string;
  onlineUserIds: string[];
  loadingConversations: boolean;
  searchText: string;
  searchResults: ChatUser[];
  showSaved: boolean;
  savedMessages: SavedMessage[];
  savedIds: string[];
  onSearchChange: (text: string) => void;
  onSelectConversation: (id: string, type: 'direct' | 'group') => void;
  onStartConversation: (user: ChatUser) => void;
  onToggleShowSaved: () => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  selectedType,
  currentUserId,
  onlineUserIds,
  loadingConversations,
  searchText,
  searchResults,
  showSaved,
  savedMessages,
  savedIds,
  onSearchChange,
  onSelectConversation,
  onStartConversation,
  onToggleShowSaved,
}: ConversationListProps) {
  return (
    <aside className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-white/10 md:w-80 lg:w-96`}>
      <div className="border-b border-white/10 p-4">
        <input
          value={searchText}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Find people by name or username"
          className="w-full rounded-xl border border-white/10 bg-[#0b1326] px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        {searchText.trim().length >= 2 && searchResults.length > 0 && (
          <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1326]">
            {searchResults.map(person => (
              <button
                key={person._id}
                onClick={() => onStartConversation(person)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-white/5"
              >
                <img src={person.avatarUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{person.name}</span>
                  <span className="block truncate text-xs text-slate-400">@{person.githubUsername}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={onToggleShowSaved}
          className={`mt-3 w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold ${
            showSaved ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          Saved messages <span className="float-right text-slate-500">{savedIds.length}</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {showSaved ? (
          savedMessages.length === 0 ? (
            <p className="p-5 text-center text-xs text-slate-500">No saved messages yet.</p>
          ) : (
            savedMessages.map(saved => {
              const message = saved.messageId;
              return message ? (
                <button
                  key={saved._id}
                  onClick={() => {
                    if (message.conversationId) onSelectConversation(String(message.conversationId), 'direct');
                    else if (message.projectId) onSelectConversation(message.projectId, 'group');
                  }}
                  className="w-full rounded-xl p-3 text-left hover:bg-white/5"
                >
                  <span className="block text-xs font-semibold text-cyan-200">{message.senderName}</span>
                  <span className="mt-1 block truncate text-xs text-slate-400">{message.text || 'Attachment'}</span>
                </button>
              ) : null;
            })
          )
        ) : loadingConversations ? (
          <p className="p-5 text-center text-xs text-slate-500">Loading conversations…</p>
        ) : conversations.length === 0 ? (
          <p className="p-5 text-center text-xs text-slate-500">Search for someone to start a conversation.</p>
        ) : (
          conversations.map(conversation => {
            const person = conversation.participants.find(participant => participant._id !== currentUserId);
            const isSelected = selectedId === conversation._id && selectedType === conversation.type;

            return (
              <button
                key={`${conversation.type}-${conversation._id}`}
                onClick={() => onSelectConversation(conversation._id, conversation.type)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                  isSelected ? 'bg-cyan-500/10 ring-1 ring-cyan-400/20' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className="relative shrink-0">
                  {conversation.type === 'group' ? (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">#</div>
                  ) : (
                    <img src={person?.avatarUrl || 'https://github.com/ghost.png'} alt="" className="h-11 w-11 rounded-xl border border-white/10 object-cover" />
                  )}
                  {conversation.type === 'direct' && person && onlineUserIds.includes(person._id) && (
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#07101f] bg-emerald-400" />
                  )}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {conversation.type === 'group' ? conversation.title : (person?.name || 'Former member')}
                    </span>
                    {conversation.lastMessageAt && (
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {new Date(conversation.lastMessageAt).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-slate-400">
                      {conversation.type === 'group' && <b className="mr-1 text-cyan-300">Group</b>}
                      {conversation.lastMessage?.text || (conversation.lastMessage ? 'Attachment' : 'Start a conversation')}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-slate-950">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
