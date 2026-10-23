"use client";
import React from 'react';
import { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string;
  isSaved: boolean;
  onReply: (message: ChatMessage) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onToggleSave: (messageId: string) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onDownloadText: (message: ChatMessage) => void;
}

export default function MessageBubble({
  message,
  currentUserId,
  isSaved,
  onReply,
  onReact,
  onToggleSave,
  onEdit,
  onDelete,
  onDownloadText,
}: MessageBubbleProps) {
  const mine = message.userId === currentUserId;
  const reply = typeof message.replyTo === 'object' ? message.replyTo : null;
  const receipt = mine
    ? message.readBy?.some(id => id !== currentUserId)
      ? 'Read'
      : message.deliveredTo?.some(id => id !== currentUserId)
      ? 'Delivered'
      : 'Sent'
    : '';

  return (
    <div className={`group mb-5 flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && (
        <img
          src={message.senderAvatar || 'https://github.com/ghost.png'}
          alt=""
          className="h-8 w-8 rounded-lg object-cover"
        />
      )}
      <div className={`max-w-[88%] md:max-w-[76%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl border px-4 py-3 ${
            mine
              ? 'rounded-br-sm border-cyan-400/25 bg-cyan-500/10 text-white'
              : 'rounded-bl-sm border-white/10 bg-white/[0.04] text-slate-200'
          }`}
        >
          {reply && (
            <div className="mb-2 border-l-2 border-cyan-400/60 pl-2 text-[11px] text-slate-400">
              <b>{reply.senderName}</b> · {reply.isDeleted ? 'Message deleted' : reply.text || 'Attachment'}
            </div>
          )}

          {message.isDeleted ? (
            <span className="italic text-slate-500">This message was deleted</span>
          ) : (
            <>
              {message.text && <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>}

              {message.imageUrl && (
                <a href={message.imageUrl} target="_blank" rel="noreferrer">
                  <img
                    src={message.imageUrl}
                    alt="Attached image"
                    className="mt-2 max-h-64 max-w-full rounded-xl border border-white/10"
                  />
                </a>
              )}

              {message.attachments?.map((attachment, index) =>
                attachment.mimeType.startsWith('image/') ? (
                  <span key={`${message._id}-${index}`} className="mt-2 block">
                    <a href={attachment.url} target="_blank" rel="noreferrer">
                      <img
                        src={attachment.url}
                        alt={attachment.fileName}
                        className="max-h-64 max-w-full rounded-xl border border-white/10"
                      />
                    </a>
                    <a
                      href={`/api/chat/attachments/download?messageId=${message._id}&index=${index}`}
                      className="mt-1 inline-block text-[10px] text-cyan-300 hover:text-cyan-100"
                    >
                      Download {attachment.fileName}
                    </a>
                  </span>
                ) : (
                  <a
                    key={`${message._id}-${index}`}
                    href={`/api/chat/attachments/download?messageId=${message._id}&index=${index}`}
                    className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-cyan-200 hover:border-cyan-400/30"
                  >
                    <span>↧</span>
                    <span className="max-w-56 truncate">{attachment.fileName}</span>
                    <span className="text-slate-500">{Math.max(1, Math.round(attachment.size / 1024))} KB</span>
                  </a>
                )
              )}
            </>
          )}
        </div>

        {/* Message Timestamp & Delivery Receipt */}
        <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-slate-500">
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {message.editedAt ? ' · edited' : ''}
          </span>
          {receipt && <span className={receipt === 'Read' ? 'text-cyan-300' : ''}>{receipt}</span>}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-1 flex gap-1">
            {message.reactions.map(reaction => (
              <span key={`${reaction.userId}-${reaction.emoji}`} className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {!message.isDeleted && (
          <div className="mt-1 flex flex-wrap gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <button
              onClick={() => onReply(message)}
              className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200"
            >
              Reply
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(message.text)}
              className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200"
            >
              Copy
            </button>
            <button
              onClick={() => onReact(message, '👍')}
              className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200"
            >
              👍
            </button>
            <button
              onClick={() => onReact(message, '❤️')}
              className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200"
            >
              ❤️
            </button>
            <button
              onClick={() => onToggleSave(message._id)}
              className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200"
            >
              {isSaved ? 'Unsave' : 'Save'}
            </button>
            {mine && (
              <button
                onClick={() => onEdit(message)}
                className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200"
              >
                Edit
              </button>
            )}
            {mine && (
              <button
                onClick={() => onDelete(message)}
                className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-rose-300"
              >
                Delete
              </button>
            )}
            {message.text && (
              <button
                onClick={() => onDownloadText(message)}
                className="rounded px-1.5 py-1 text-[10px] text-slate-500 hover:text-cyan-200"
              >
                Download
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
