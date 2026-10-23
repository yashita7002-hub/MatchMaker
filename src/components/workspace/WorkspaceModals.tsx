"use client";
import React from 'react';
import { WorkspaceProject, WorkspaceUser, getEqualExpenseShares } from './WorkspaceTypes';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: WorkspaceProject;
  todayStr: string;
  taskTitle: string;
  onChangeTaskTitle: (val: string) => void;
  taskDesc: string;
  onChangeTaskDesc: (val: string) => void;
  taskAssigneeId: string;
  onChangeTaskAssigneeId: (val: string) => void;
  taskDueDate: string;
  onChangeTaskDueDate: (val: string) => void;
  savingTask: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  project,
  todayStr,
  taskTitle,
  onChangeTaskTitle,
  taskDesc,
  onChangeTaskDesc,
  taskAssigneeId,
  onChangeTaskAssigneeId,
  taskDueDate,
  onChangeTaskDueDate,
  savingTask,
  onSubmit,
}: TaskModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 flex flex-col gap-5 border border-white/15 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Create Sprint Task</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Task Title *</label>
            <input type="text" className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={taskTitle} onChange={(e) => onChangeTaskTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Description</label>
            <textarea rows={2} className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs resize-none" value={taskDesc} onChange={(e) => onChangeTaskDesc(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Assign Teammate</label>
            <select className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={taskAssigneeId} onChange={(e) => onChangeTaskAssigneeId(e.target.value)}>
              <option value="">-- Unassigned --</option>
              {project.members.map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Target Date</label>
            <input type="date" min={todayStr} className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={taskDueDate} onChange={(e) => onChangeTaskDueDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">Cancel</button>
            <button type="submit" className="btn-primary !text-xs !py-2 !px-5" disabled={savingTask}>
              {savingTask ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadTitle: string;
  onChangeThreadTitle: (val: string) => void;
  threadCategory: string;
  onChangeThreadCategory: (val: string) => void;
  savingThread: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ThreadModal({
  isOpen,
  onClose,
  threadTitle,
  onChangeThreadTitle,
  threadCategory,
  onChangeThreadCategory,
  savingThread,
  onSubmit,
}: ThreadModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 flex flex-col gap-5 border border-white/15 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Start Discussion Thread</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Thread Title *</label>
            <input type="text" className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={threadTitle} onChange={(e) => onChangeThreadTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Category</label>
            <select className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={threadCategory} onChange={(e) => onChangeThreadCategory(e.target.value)}>
              <option value="Planning">Planning</option>
              <option value="Design">Design</option>
              <option value="Bugs to Fix">Bugs to Fix</option>
              <option value="General">General</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">Cancel</button>
            <button type="submit" className="btn-primary !text-xs !py-2 !px-5" disabled={savingThread}>
              {savingThread ? 'Creating...' : 'Start Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: WorkspaceProject;
  user: WorkspaceUser | null;
  expenseError: string;
  expenseTitle: string;
  onChangeExpenseTitle: (val: string) => void;
  expenseAmount: string;
  onChangeExpenseAmount: (val: string) => void;
  expenseCategory: string;
  onChangeExpenseCategory: (val: string) => void;
  expenseDesc: string;
  onChangeExpenseDesc: (val: string) => void;
  expenseParticipantIds: string[];
  setExpenseParticipantIds: React.Dispatch<React.SetStateAction<string[]>>;
  customExpenseSplit: boolean;
  setCustomExpenseSplit: (val: boolean) => void;
  expenseShares: Record<string, string>;
  setExpenseShares: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loggingExpense: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ExpenseModal({
  isOpen,
  onClose,
  project,
  user,
  expenseError,
  expenseTitle,
  onChangeExpenseTitle,
  expenseAmount,
  onChangeExpenseAmount,
  expenseCategory,
  onChangeExpenseCategory,
  expenseDesc,
  onChangeExpenseDesc,
  expenseParticipantIds,
  setExpenseParticipantIds,
  customExpenseSplit,
  setCustomExpenseSplit,
  expenseShares,
  setExpenseShares,
  loggingExpense,
  onSubmit,
}: ExpenseModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 flex flex-col gap-5 border border-white/15 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Log Project Expense</h2>
        {expenseError && (
          <p role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
            {expenseError}
          </p>
        )}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Expense Title *</label>
            <input type="text" className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={expenseTitle} onChange={(e) => onChangeExpenseTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Amount ($) *</label>
            <input type="number" min="0.01" step="0.01" className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={expenseAmount} onChange={(e) => onChangeExpenseAmount(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Category</label>
            <select className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={expenseCategory} onChange={(e) => onChangeExpenseCategory(e.target.value)}>
              <option value="Hosting">Hosting</option>
              <option value="Domains">Domains</option>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Description *</label>
            <textarea
              className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs resize-y"
              rows={3}
              value={expenseDesc}
              onChange={(e) => onChangeExpenseDesc(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-slate-300">Participating Members *</label>
              <div className="flex rounded-lg border border-white/10 overflow-hidden text-[10px]">
                <button
                  type="button"
                  onClick={() => setCustomExpenseSplit(false)}
                  className={`px-2.5 py-1 ${!customExpenseSplit ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                >
                  Split equally
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const equalShares = getEqualExpenseShares(Number(expenseAmount), expenseParticipantIds);
                    setExpenseShares(Object.fromEntries(
                      Object.entries(equalShares).map(([memberId, share]) => [memberId, share.toFixed(2)])
                    ));
                    setCustomExpenseSplit(true);
                  }}
                  className={`px-2.5 py-1 ${customExpenseSplit ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                >
                  Custom shares
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 p-3">
              {project.members.map(member => {
                const selected = expenseParticipantIds.includes(member._id);
                const equalShare = getEqualExpenseShares(Number(expenseAmount), expenseParticipantIds)[member._id] || 0;
                return (
                  <div key={member._id} className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 min-w-0 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          setExpenseParticipantIds(current => {
                            const next = event.target.checked
                              ? [...current, member._id]
                              : current.filter(id => id !== member._id);
                            return next;
                          });
                          if (!event.target.checked) {
                            setExpenseShares(current => {
                              const next = { ...current };
                              delete next[member._id];
                              return next;
                            });
                          } else if (customExpenseSplit) {
                            setExpenseShares(current => ({ ...current, [member._id]: '' }));
                          }
                        }}
                        className="accent-cyan-400"
                      />
                      <span className="truncate">{member.name}</span>
                      {member._id === user?._id && <span className="text-slate-500">(You)</span>}
                    </label>
                    {selected && (
                      customExpenseSplit ? (
                        <label className="flex items-center gap-1 text-[10px] text-slate-400">
                          $
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            aria-label={`${member.name} share`}
                            value={expenseShares[member._id] || ''}
                            onChange={(event) => setExpenseShares(current => ({
                              ...current,
                              [member._id]: event.target.value,
                            }))}
                            className="w-20 bg-[#020617] border border-white/10 rounded-md px-2 py-1 text-xs text-white"
                          />
                        </label>
                      ) : (
                        <span className="text-[11px] font-mono text-cyan-300">${equalShare.toFixed(2)}</span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
            {customExpenseSplit && (
              <p className={`text-[10px] ${
                expenseParticipantIds.reduce((sum, memberId) => sum + Math.round(Number(expenseShares[memberId]) * 100 || 0), 0) === Math.round(Number(expenseAmount) * 100)
                  ? 'text-emerald-300'
                  : 'text-amber-300'
              }`}>
                Shares must total ${Number(expenseAmount || 0).toFixed(2)}.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300" disabled={loggingExpense}>Cancel</button>
            <button type="submit" className="btn-primary !text-xs !py-2 !px-5" disabled={loggingExpense}>
              {loggingExpense ? 'Logging...' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultError: string;
  vaultLinkName: string;
  onChangeVaultLinkName: (val: string) => void;
  vaultLinkUrl: string;
  onChangeVaultLinkUrl: (val: string) => void;
  vaultLinkDescription: string;
  onChangeVaultLinkDescription: (val: string) => void;
  vaultLinkType: string;
  onChangeVaultLinkType: (val: string) => void;
  savingVaultLink: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function VaultModal({
  isOpen,
  onClose,
  vaultError,
  vaultLinkName,
  onChangeVaultLinkName,
  vaultLinkUrl,
  onChangeVaultLinkUrl,
  vaultLinkDescription,
  onChangeVaultLinkDescription,
  vaultLinkType,
  onChangeVaultLinkType,
  savingVaultLink,
  onSubmit,
}: VaultModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 flex flex-col gap-5 border border-white/15 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Add Vault Resource</h2>
        {vaultError && (
          <p role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
            {vaultError}
          </p>
        )}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Resource Name *</label>
            <input type="text" className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={vaultLinkName} onChange={(e) => onChangeVaultLinkName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">URL *</label>
            <input type="url" className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={vaultLinkUrl} onChange={(e) => onChangeVaultLinkUrl(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Description <span className="text-slate-500">(Optional)</span></label>
            <textarea
              className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs resize-y"
              rows={3}
              value={vaultLinkDescription}
              onChange={(e) => onChangeVaultLinkDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Category Type</label>
            <select className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs" value={vaultLinkType} onChange={(e) => onChangeVaultLinkType(e.target.value)}>
              <option value="Code">Code</option>
              <option value="Design">Design</option>
              <option value="Docs">Docs</option>
              <option value="Infra">Infra</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300" disabled={savingVaultLink}>Cancel</button>
            <button type="submit" className="btn-primary !text-xs !py-2 !px-5" disabled={savingVaultLink}>
              {savingVaultLink ? 'Saving...' : 'Save Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: WorkspaceProject | null;
  user: WorkspaceUser | null;
  removeMemberTarget: WorkspaceUser | null;
  onSelectMemberTarget: (member: WorkspaceUser | null) => void;
  removeReason: string;
  onChangeRemoveReason: (val: string) => void;
  removingMember: boolean;
  removeStatusText: string;
  onConfirmRemove: () => void;
}

export function RemoveMemberModal({
  isOpen,
  onClose,
  project,
  user,
  removeMemberTarget,
  onSelectMemberTarget,
  removeReason,
  onChangeRemoveReason,
  removingMember,
  removeStatusText,
  onConfirmRemove,
}: RemoveMemberModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 flex flex-col gap-5 border border-white/15 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Manage Squad Teammates</h2>
        {removeStatusText && (
          <div className="p-3 rounded-xl text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300">
            {removeStatusText}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Select Teammate to Remove</label>
            <select 
              className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs"
              onChange={(e) => {
                const memberId = e.target.value;
                const member = project?.members.find(m => m._id === memberId);
                onSelectMemberTarget(member || null);
              }}
              value={removeMemberTarget?._id || ''}
            >
              <option value="">-- Choose teammate --</option>
              {project?.members.filter(m => m._id !== user?._id).map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
          </div>
          
          {removeMemberTarget && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300">Reason for Removal (Optional)</label>
              <textarea 
                className="bg-[#020617] border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs resize-none" 
                rows={2} 
                placeholder="e.g. Schedule misalignment, pivoting direction" 
                value={removeReason} 
                onChange={(e) => onChangeRemoveReason(e.target.value)} 
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">Cancel</button>
            <button type="button" onClick={onConfirmRemove} disabled={!removeMemberTarget || removingMember} className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition-all">
              {removingMember ? 'Removing...' : 'Remove Builder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
