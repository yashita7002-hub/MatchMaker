"use client";
import React from 'react';
import Link from 'next/link';
import { Message } from './WorkspaceTypes';

interface ChatTabProps {
  messages: Message[];
  typingUser: string;
  chatInput: string;
  chatFiles: File[];
  chatReplyTo: Message | null;
  uploadingImage: boolean;
  chatUploadProgress: string;
  chatError: string;
  userId?: string;
  projectTitle: string;
  chatBottomRef: React.RefObject<HTMLDivElement>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilesChange: (files: File[]) => void;
  onReplyTo: (msg: Message | null) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onUpdateMessage: (msg: Message, action: 'edit' | 'delete' | 'react', payload: Record<string, string>) => void;
  onSaveMessage: (messageId: string) => void;
  onDownloadText: (msg: Message) => void;
  findUsernameByName: (name: string) => string | null;
}

export default function ChatTab({
  messages,
  typingUser,
  chatInput,
  chatFiles,
  chatReplyTo,
  uploadingImage,
  chatUploadProgress,
  chatError,
  userId,
  projectTitle,
  chatBottomRef,
  onInputChange,
  onFilesChange,
  onReplyTo,
  onSendMessage,
  onUpdateMessage,
  onSaveMessage,
  onDownloadText,
  findUsernameByName,
}: ChatTabProps) {
  return (
    <div className="glass-panel flex flex-col flex-1 h-full rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-white">Team chat</p>
          <p className="text-[11px] text-slate-500">{projectTitle}</p>
        </div>
        <Link href="/messages" className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/15">
          Direct messages
        </Link>
      </div>

      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 max-h-[540px]">
        {messages.length === 0 ? (
          <div className="m-auto text-center py-16 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs text-slate-400 font-mono">No messages yet. Send a greeting to start collaborating!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = userId === msg.userId;
            const senderUsername = findUsernameByName(msg.senderName);
            const reply = typeof msg.replyTo === 'object' ? msg.replyTo : null;
            const receipt = isMe
              ? msg.readBy?.some((id) => id !== userId) ? 'Read'
                : msg.deliveredTo?.some((id) => id !== userId) ? 'Delivered' : 'Sent'
              : '';

            return (
              <div key={msg._id || idx} className={`group flex gap-3.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                {senderUsername ? (
                  <Link href={`/profile/${senderUsername}`} className="shrink-0">
                    <img src={msg.senderAvatar || 'https://github.com/ghost.png'} alt={msg.senderName} className="w-9 h-9 rounded-xl border border-white/20 hover:border-cyan-400 transition-colors object-cover" />
                  </Link>
                ) : (
                  <img src={msg.senderAvatar || 'https://github.com/ghost.png'} alt={msg.senderName} className="w-9 h-9 rounded-xl border border-white/20 object-cover" />
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] gap-1`}>
                  <div className="flex items-baseline gap-2">
                    {senderUsername ? (
                      <Link href={`/profile/${senderUsername}`} className="text-xs font-bold text-slate-300 hover:text-cyan-300 transition-colors">{msg.senderName}</Link>
                    ) : (
                      <span className="text-xs font-bold text-slate-300">{msg.senderName}</span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`px-4 py-2.5 text-xs md:text-sm leading-relaxed backdrop-blur-md shadow-md ${isMe ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-white border border-cyan-400/40 rounded-2xl rounded-tr-sm shadow-cyan-500/10' : 'bg-[#020617]/80 text-slate-200 border border-white/10 rounded-2xl rounded-tl-sm'}`}>
                    {reply && <div className="mb-2 border-l-2 border-cyan-400/60 pl-2 text-[11px] text-slate-400"><b>{reply.senderName}</b> · {reply.isDeleted ? 'Message deleted' : reply.text || 'Attachment'}</div>}
                    {msg.isDeleted ? <span className="italic text-slate-500">This message was deleted</span> : (
                      <>
                        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                        {msg.imageUrl && <a href={msg.imageUrl} target="_blank" rel="noreferrer"><img src={msg.imageUrl} alt="Attached" className="max-w-full max-h-[220px] rounded-xl mt-2 border border-white/10" /></a>}
                        {msg.attachments?.map((att, attIdx) =>
                          att.mimeType.startsWith('image/') ? (
                            <span key={`${msg._id}-${attIdx}`} className="mt-2 block">
                              {att.url && <a href={att.url} target="_blank" rel="noreferrer"><img src={att.url} alt={att.fileName} className="max-h-[220px] max-w-full rounded-xl border border-white/10" /></a>}
                              <a href={`/api/chat/attachments/download?messageId=${msg._id}&index=${attIdx}`} className="mt-1 inline-block text-[10px] text-cyan-300 hover:text-cyan-100">Download {att.fileName}</a>
                            </span>
                          ) : (
                            <a key={`${msg._id}-${attIdx}`} href={`/api/chat/attachments/download?messageId=${msg._id}&index=${attIdx}`} className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-cyan-200 hover:border-cyan-400/30">
                              <span>↧</span><span className="max-w-56 truncate">{att.fileName}</span><span className="text-slate-500">{Math.max(1, Math.round(att.size / 1024))} KB</span>
                            </a>
                          )
                        )}
                      </>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-slate-500">
                    {receipt && <span className={receipt === 'Read' ? 'text-cyan-300' : ''}>{receipt}</span>}
                    {msg.editedAt && <span>edited</span>}
                  </div>
                  {msg.reactions?.length ? (
                    <div className="mt-1 flex gap-1">
                      {msg.reactions.map((r) => <span key={`${r.userId}-${r.emoji}`} className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs">{r.emoji}</span>)}
                    </div>
                  ) : null}
                  {!msg.isDeleted && (
                    <div className="mt-1 flex flex-wrap gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <button onClick={() => onReplyTo(msg)} className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200">Reply</button>
                      <button onClick={() => navigator.clipboard.writeText(msg.text)} className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200">Copy</button>
                      <button onClick={() => onUpdateMessage(msg, 'react', { emoji: '👍' })} className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200">👍</button>
                      <button onClick={() => onSaveMessage(msg._id)} className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200">Save</button>
                      {isMe && <button onClick={() => { const text = window.prompt('Edit your message', msg.text); if (text !== null && text.trim()) onUpdateMessage(msg, 'edit', { text }); }} className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200">Edit</button>}
                      {isMe && <button onClick={() => { if (window.confirm('Delete this message for everyone?')) onUpdateMessage(msg, 'delete', {}); }} className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-rose-300">Delete</button>}
                      {msg.text && <button onClick={() => onDownloadText(msg)} className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200">Download</button>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {typingUser && (
          <div className="flex gap-2 items-center text-xs text-cyan-400 font-mono italic">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{typingUser} is typing...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {chatReplyTo && (
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-slate-300">
          <span className="truncate">Replying to {chatReplyTo.senderName}: {chatReplyTo.text || 'Attachment'}</span>
          <button onClick={() => onReplyTo(null)} className="ml-3 text-slate-500 hover:text-white">✕</button>
        </div>
      )}
      {chatFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-2">
          {chatFiles.map((file, i) => (
            <span key={`${file.name}-${i}`} className="rounded-lg bg-cyan-500/10 px-2.5 py-1.5 text-[11px] text-cyan-200">
              {file.name}
              <button type="button" onClick={() => onFilesChange(chatFiles.filter((_, fi) => fi !== i))} className="ml-2 text-slate-400">×</button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={onSendMessage} className="p-4 bg-[#020617]/90 border-t border-white/10 flex items-center gap-3">
        <label className="cursor-pointer text-slate-400 hover:text-white p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors shrink-0" title="Attach images and documents">
          ＋
          <input type="file" multiple accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.txt,.csv" onChange={(e) => { onFilesChange([...chatFiles, ...Array.from(e.target.files || [])].slice(0, 5)); e.currentTarget.value = ''; }} className="hidden" />
        </label>
        <input
          type="text"
          className="flex-1 bg-[#0b1326]/80 border border-white/10 text-xs md:text-sm text-white rounded-xl px-4 py-2.5 outline-none focus:border-cyan-400 transition-colors"
          placeholder="Type a team message..."
          value={chatInput}
          onChange={onInputChange}
          disabled={uploadingImage}
        />
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all shrink-0 disabled:opacity-50" disabled={uploadingImage || (!chatInput.trim() && chatFiles.length === 0)}>
          {uploadingImage ? '...' : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
      <div className="min-h-5 px-4 pb-2 text-[10px] text-slate-500">{chatUploadProgress || (chatError ? <span className="text-rose-300">{chatError}</span> : 'Images and documents up to 15 MB')}</div>
    </div>
  );
}
