"use client";
import React from 'react';
import { ChatMessage } from '@/types';

const acceptedFiles = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.txt,.csv';

interface ChatInputProps {
  messageText: string;
  selectedFiles: File[];
  sending: boolean;
  uploadProgress: string;
  error: string;
  replyTo: ChatMessage | null;
  onMessageChange: (text: string) => void;
  onFilesChange: (files: File[]) => void;
  onCancelReply: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ChatInput({
  messageText,
  selectedFiles,
  sending,
  uploadProgress,
  error,
  replyTo,
  onMessageChange,
  onFilesChange,
  onCancelReply,
  onSubmit,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesChange([...selectedFiles, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    onFilesChange(selectedFiles.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <>
      {replyTo && (
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-slate-300">
          <span className="truncate">
            Replying to {replyTo.senderName}: {replyTo.text || 'Attachment'}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="ml-3 text-slate-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-2">
          {selectedFiles.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="rounded-lg bg-cyan-500/10 px-2.5 py-1.5 text-[11px] text-cyan-200 flex items-center"
            >
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 text-slate-400 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-white/10 bg-[#020617]/60 p-3 md:gap-3 md:p-4">
        <label
          className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-slate-400 hover:text-cyan-200"
          title="Attach files"
        >
          ＋
          <input
            type="file"
            multiple
            accept={acceptedFiles}
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <textarea
          value={messageText}
          onChange={e => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Write a message…"
          className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-white/10 bg-[#0b1326] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          disabled={sending}
        />

        <button
          type="submit"
          disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
          className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
        >
          {sending ? '…' : 'Send'}
        </button>
      </form>

      <p className="min-h-5 px-4 pb-2 text-[10px] text-slate-500">
        {uploadProgress || (
          error ? (
            <span className="text-rose-300">{error}</span>
          ) : (
            'Images and documents up to 15 MB · Enter to send, Shift+Enter for a new line'
          )
        )}
      </p>
    </>
  );
}
