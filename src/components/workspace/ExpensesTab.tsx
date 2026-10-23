"use client";
import React from 'react';
import { WorkspaceProject, WorkspaceUser, Expense, paymentStatusClass } from './WorkspaceTypes';

interface ExpensesTabProps {
  project: WorkspaceProject;
  expenses: Expense[];
  user: WorkspaceUser | null;
  expandedExpenseId: string | null;
  paymentActionKey: string | null;
  paymentActionError: string;
  paymentActionMessage: string;
  onOpenExpenseModal: () => void;
  onToggleBreakdown: (expenseId: string) => void;
  onExpensePaymentAction: (expenseId: string, action: 'claim' | 'confirm' | 'reject', participantId?: string) => void;
}

export default function ExpensesTab({
  project,
  expenses,
  user,
  expandedExpenseId,
  paymentActionKey,
  paymentActionError,
  paymentActionMessage,
  onOpenExpenseModal,
  onToggleBreakdown,
  onExpensePaymentAction,
}: ExpensesTabProps) {
  const totalExpenseSum = expenses.reduce((sum, item) => sum + item.amount, 0);
  const now = new Date();
  const currentMonthSpend = expenses
    .filter(expense => {
      const createdAt = new Date(expense.createdAt);
      return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalPaidAmount = expenses.reduce(
    (total, expense) => total + (expense.participants || [])
      .filter(participant => participant.status === 'Paid')
      .reduce((paid, participant) => paid + participant.shareAmount, 0),
    0
  );

  const outstandingAmount = expenses.reduce(
    (total, expense) => total + (expense.participants || [])
      .filter(participant => participant.status !== 'Paid')
      .reduce((outstanding, participant) => outstanding + participant.shareAmount, 0),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Squad Spend</span>
          <div className="text-2xl font-black text-rose-400 mt-2 font-mono">${totalExpenseSum.toFixed(2)}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Current Month</span>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">${currentMonthSpend.toFixed(2)}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Cost Per Builder</span>
          <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">${(totalExpenseSum / Math.max(1, project.members.length)).toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Paid</span>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">${totalPaidAmount.toFixed(2)}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Outstanding Amount</span>
          <div className="text-2xl font-black text-amber-300 mt-2 font-mono">${outstandingAmount.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <h3 className="text-base font-bold text-white tracking-tight">Expense Receipts Log</h3>
          <button
            onClick={onOpenExpenseModal}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold transition-all"
          >
            + Log Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center border-dashed border-white/15">
            <p className="text-slate-400 text-xs">No team expenses recorded for this project.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(paymentActionError || paymentActionMessage) && (
              <p
                role={paymentActionError ? 'alert' : 'status'}
                className={`text-xs rounded-xl px-3 py-2 border ${
                  paymentActionError
                    ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                    : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                {paymentActionError || paymentActionMessage}
              </p>
            )}
            {expenses.map(expense => {
              const participants = expense.participants || [];
              const paidForExpense = participants
                .filter(participant => participant.status === 'Paid')
                .reduce((sum, participant) => sum + participant.shareAmount, 0);
              const remainingForExpense = Math.max(0, expense.amount - paidForExpense);
              const paidProgress = expense.amount > 0
                ? Math.min(100, (paidForExpense / expense.amount) * 100)
                : 0;
              const canVerifyPayment = project.ownerId._id === user?._id;
              const isBreakdownExpanded = expandedExpenseId === expense._id;

              return (
                <div key={expense._id} className="p-4 rounded-xl bg-[#020617]/70 border border-white/10 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white">{expense.title}</h4>
                      {expense.description && <p className="text-xs text-slate-300 mt-1">{expense.description}</p>}
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-mono text-slate-500 mt-1">
                        <span>Added by {expense.loggedBy || 'Team member'}</span>
                        <span aria-hidden="true">•</span>
                        <span>{new Date(expense.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-slate-300">
                        {expense.category}
                      </span>
                      <span className="text-sm font-black text-cyan-300 font-mono">${expense.amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-slate-400">
                      <span className="text-emerald-300">${paidForExpense.toFixed(2)} paid</span>
                      <span className="mx-2 text-slate-600">·</span>
                      <span>${remainingForExpense.toFixed(2)} remaining</span>
                    </p>
                    <button
                      type="button"
                      aria-expanded={isBreakdownExpanded}
                      onClick={() => onToggleBreakdown(expense._id)}
                      className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                    >
                      {isBreakdownExpanded ? 'Hide' : 'Payment Breakdown'}
                    </button>
                  </div>
                  {isBreakdownExpanded && (
                    <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-300">Total Expense: <strong className="text-white">${expense.amount.toFixed(2)}</strong></span>
                        <span className="text-emerald-300">Paid: ${paidForExpense.toFixed(2)}</span>
                        <span className="text-amber-300">Remaining: ${remainingForExpense.toFixed(2)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${paidProgress}%` }} />
                      </div>
                      {participants.length === 0 ? (
                        <p className="text-xs text-slate-400">No participant shares are assigned to this expense.</p>
                      ) : participants.map((participant, index) => {
                        const participantId = participant.userId?._id;
                        const isOwnShare = Boolean(participantId && participantId === user?._id);
                        const rowActionKey = `${expense._id}:${participantId || ''}`;
                        const isActionBusy = paymentActionKey === rowActionKey;

                        return (
                          <div key={participantId || `missing-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {participant.userId?.avatarUrl ? (
                                <img src={participant.userId.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                                  {participant.userId?.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">
                                  {participant.userId?.name || 'Former or unavailable member'}
                                  {isOwnShare && <span className="ml-1 text-slate-400">(You)</span>}
                                </p>
                                <p className="text-[11px] text-cyan-300 font-mono">${participant.shareAmount.toFixed(2)} share</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-1 rounded-full border text-[10px] font-semibold ${paymentStatusClass[participant.status]}`}>
                                {participant.status}
                              </span>
                              {participant.verifiedBy?.name && (
                                <span className="text-[10px] text-slate-500">
                                  {participant.status === 'Rejected' ? 'Reviewed by' : 'Verified by'} {participant.verifiedBy.name}
                                  {participant.verifiedAt && ` · ${new Date(participant.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                </span>
                              )}
                              {isOwnShare && (participant.status === 'Pending' || participant.status === 'Rejected') && (
                                <button
                                  type="button"
                                  onClick={() => onExpensePaymentAction(expense._id, 'claim', participantId)}
                                  disabled={isActionBusy}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20 text-[10px] font-semibold disabled:opacity-50"
                                >
                                  {isActionBusy ? 'Submitting...' : 'I Have Paid'}
                                </button>
                              )}
                              {canVerifyPayment && participant.status === 'Awaiting Verification' && participantId && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onExpensePaymentAction(expense._id, 'confirm', participantId)}
                                    disabled={isActionBusy}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-semibold disabled:opacity-50"
                                  >
                                    {isActionBusy ? 'Saving...' : 'Confirm'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onExpensePaymentAction(expense._id, 'reject', participantId)}
                                    disabled={isActionBusy}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 text-[10px] font-semibold disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
