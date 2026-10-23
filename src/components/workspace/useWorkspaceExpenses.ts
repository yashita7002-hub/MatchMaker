"use client";
import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { WorkspaceProject, Expense } from './WorkspaceTypes';

interface UseWorkspaceExpensesProps {
  projectId: string;
  project: WorkspaceProject | null;
  socketRef: React.MutableRefObject<Socket | null>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

export function useWorkspaceExpenses({
  projectId,
  project,
  socketRef,
  setExpenses,
}: UseWorkspaceExpensesProps) {
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Hosting');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseParticipantIds, setExpenseParticipantIds] = useState<string[]>([]);
  const [customExpenseSplit, setCustomExpenseSplit] = useState(false);
  const [expenseShares, setExpenseShares] = useState<Record<string, string>>({});
  const [loggingExpense, setLoggingExpense] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [paymentActionKey, setPaymentActionKey] = useState<string | null>(null);
  const [paymentActionError, setPaymentActionError] = useState('');
  const [paymentActionMessage, setPaymentActionMessage] = useState('');

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      setExpenseError('Enter a valid expense title and amount.');
      return;
    }
    if (!project || expenseParticipantIds.length === 0) {
      setExpenseError('Select at least one participating project member.');
      return;
    }
    const shares = customExpenseSplit
      ? expenseParticipantIds.map(memberId => ({
        memberId,
        shareAmount: Number(expenseShares[memberId]),
      }))
      : undefined;
    if (customExpenseSplit) {
      const sharesAreValid = shares?.every(share => Number.isFinite(share.shareAmount) && share.shareAmount > 0);
      const shareTotalCents = shares?.reduce((total, share) => total + Math.round(share.shareAmount * 100), 0) ?? 0;
      if (!sharesAreValid || shareTotalCents !== Math.round(amount * 100)) {
        setExpenseError('Enter a positive share for each participant, and make sure the shares equal the expense total.');
        return;
      }
    }

    try {
      setLoggingExpense(true);
      setExpenseError('');
      const res = await fetch(`/api/workspace/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expenseTitle,
          amount,
          category: expenseCategory,
          description: expenseDesc,
          participantIds: expenseParticipantIds,
          shares,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to log expense');
      }

      setExpenses(prev => [json.expense, ...prev]);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseDesc('');
      setExpenseParticipantIds([]);
      setExpenseShares({});
      setCustomExpenseSplit(false);
      setShowExpenseModal(false);
      socketRef.current?.emit('expense-update', { projectId });
      json.notifications?.forEach((notif: { userId: string; _id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string }) => {
        socketRef.current?.emit('notify-users', { userIds: [notif.userId], notification: notif });
      });
    } catch (err) {
      console.error('Failed to log expense:', err);
      setExpenseError(err instanceof Error ? err.message : 'Failed to log expense');
    } finally {
      setLoggingExpense(false);
    }
  };

  const handleExpensePaymentAction = async (
    expenseId: string,
    action: 'claim' | 'confirm' | 'reject',
    participantId?: string
  ) => {
    const actionKey = `${expenseId}:${participantId || action}`;
    try {
      setPaymentActionKey(actionKey);
      setPaymentActionError('');
      setPaymentActionMessage('');
      const res = await fetch(`/api/workspace/${projectId}/expenses/${expenseId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, participantId }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Unable to update payment status');
      }

      setExpenses(prev => prev.map(expense => expense._id === expenseId ? json.expense : expense));
      socketRef.current?.emit('expense-update', { projectId });
      setPaymentActionMessage(
        action === 'claim'
          ? 'Payment claim submitted for verification.'
          : action === 'confirm'
            ? 'Payment confirmed.'
            : 'Payment rejected. The member can submit a new claim.'
      );
    } catch (err) {
      console.error('Failed to update expense payment:', err);
      setPaymentActionError(err instanceof Error ? err.message : 'Unable to update payment status');
    } finally {
      setPaymentActionKey(null);
    }
  };

  return {
    expenseTitle,
    setExpenseTitle,
    expenseAmount,
    setExpenseAmount,
    expenseCategory,
    setExpenseCategory,
    expenseDesc,
    setExpenseDesc,
    expenseParticipantIds,
    setExpenseParticipantIds,
    customExpenseSplit,
    setCustomExpenseSplit,
    expenseShares,
    setExpenseShares,
    loggingExpense,
    showExpenseModal,
    setShowExpenseModal,
    expenseError,
    setExpenseError,
    expandedExpenseId,
    setExpandedExpenseId,
    paymentActionKey,
    paymentActionError,
    paymentActionMessage,
    handleLogExpense,
    handleExpensePaymentAction,
  };
}
