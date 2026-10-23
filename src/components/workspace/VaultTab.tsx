"use client";
import React from 'react';
import { VaultLink, getVaultLinkIcon } from './WorkspaceTypes';

interface VaultTabProps {
  vaultLinks: VaultLink[];
  vaultError: string;
  showVaultModal: boolean;
  deletingVaultLinkId: string | null;
  onOpenAddLink: () => void;
  onDeleteLink: (id: string) => void;
}

export default function VaultTab({ vaultLinks, vaultError, showVaultModal, deletingVaultLinkId, onOpenAddLink, onDeleteLink }: VaultTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Project Resource Vault</h3>
          <p className="text-xs text-slate-400 font-mono">Central hub for code repos, Figma files, documentation, and cloud assets</p>
        </div>
        <button onClick={onOpenAddLink} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all">
          + Add Resource Link
        </button>
      </div>

      {vaultError && !showVaultModal && (
        <p role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{vaultError}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vaultLinks.map((link) => (
          <div key={link._id} className="glass-card-hover p-5 rounded-2xl flex items-start justify-between gap-3 group border border-white/10">
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 min-w-0 flex-1 no-underline">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={link.icon || getVaultLinkIcon(link.type)} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">{link.name}</h4>
                <span className="text-xs font-mono text-slate-500 truncate block mt-0.5">{link.url}</span>
                {link.description && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{link.description}</p>}
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">{link.type}</span>
                <svg className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
            <button
              type="button"
              onClick={() => onDeleteLink(link._id)}
              disabled={deletingVaultLinkId === link._id}
              aria-label={`Delete ${link.name}`}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              {deletingVaultLinkId === link._id ? <span className="text-[10px]">...</span> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18m-2 0-.9 14H5.9L5 6m3 0V4h8v2m-7 4v6m4-6v6" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
