import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Expense from '@/models/Expense';
import { getSessionUser } from '@/lib/auth';
import { createNotifications } from '@/lib/notifications';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (!project.members.some(m => m.toString() === user._id.toString())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { title, amount, category, description, participantIds, shares } = await req.json();
    if (
      typeof title !== 'string' || !title.trim() ||
      typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001 ||
      typeof category !== 'string' || !category.trim() ||
      typeof description !== 'string' || !description.trim()
    ) {
      return NextResponse.json({ error: 'Title, a valid amount, category, and description are required' }, { status: 400 });
    }

    const projectMemberIds = project.members.map(member => member.toString());
    const selectedParticipantIds = participantIds === undefined
      ? projectMemberIds
      : participantIds;
    if (
      !Array.isArray(selectedParticipantIds) ||
      selectedParticipantIds.length === 0 ||
      selectedParticipantIds.some((memberId: unknown) => typeof memberId !== 'string' || !projectMemberIds.includes(memberId)) ||
      new Set(selectedParticipantIds).size !== selectedParticipantIds.length
    ) {
      return NextResponse.json({ error: 'Select valid project members to participate in this expense' }, { status: 400 });
    }

    const totalCents = Math.round(amount * 100);
    let participantShares: Array<{ userId: string; shareAmount: number }>;
    if (shares === undefined) {
      const centsPerMember = Math.floor(totalCents / selectedParticipantIds.length);
      let remainingCents = totalCents;
      participantShares = selectedParticipantIds.map((memberId: string, index: number) => {
        const shareCents = index === selectedParticipantIds.length - 1
          ? remainingCents
          : centsPerMember;
        remainingCents -= shareCents;
        return { userId: memberId, shareAmount: shareCents / 100 };
      });
    } else {
      if (
        !Array.isArray(shares) ||
        shares.length !== selectedParticipantIds.length ||
        shares.some((share: unknown) =>
          !share ||
          typeof share !== 'object' ||
          !('memberId' in share) ||
          !('shareAmount' in share) ||
          typeof share.memberId !== 'string' ||
          !selectedParticipantIds.includes(share.memberId) ||
          typeof share.shareAmount !== 'number' ||
          !Number.isFinite(share.shareAmount) ||
          share.shareAmount <= 0
        )
      ) {
        return NextResponse.json({ error: 'Enter a valid positive share for each selected member' }, { status: 400 });
      }
      if (new Set(shares.map((share: { memberId: string }) => share.memberId)).size !== selectedParticipantIds.length) {
        return NextResponse.json({ error: 'Each selected member must have exactly one share' }, { status: 400 });
      }
      const sharesCents = shares.map((share: { memberId: string; shareAmount: number }) => ({
        userId: share.memberId,
        shareAmount: Math.round(share.shareAmount * 100),
      }));
      if (sharesCents.some((share: { shareAmount: number }, index: number) =>
        Math.abs(shares[index].shareAmount * 100 - share.shareAmount) > 0.000001
      ) || sharesCents.reduce((sum: number, share: { shareAmount: number }) => sum + share.shareAmount, 0) !== totalCents) {
        return NextResponse.json({ error: 'Individual shares must be in cents and add up to the expense amount' }, { status: 400 });
      }
      participantShares = sharesCents.map((share: { userId: string; shareAmount: number }) => ({
        userId: share.userId,
        shareAmount: share.shareAmount / 100,
      }));
    }
    
    const expense = await Expense.create({
      projectId: project._id,
      title: title.trim(),
      amount,
      category: category.trim(),
      description: description.trim(),
      loggedBy: user.name,
      loggedById: user._id,
      participants: participantShares,
    });

    const otherMembers = project.members
      .filter(m => m.toString() !== user._id.toString())
      .map(m => m.toString());
    const notifications = await createNotifications(
      otherMembers,
      'expense',
      `${user.name} logged expense "${title}" ($${Number(amount).toFixed(2)}) in ${project.title}`,
      `/workspace/${project._id}`
    );
    
    await expense.populate('participants.userId', 'name githubUsername avatarUrl');
    return NextResponse.json({ success: true, expense, notifications, notifyUserIds: otherMembers });
  } catch (error) {
    console.error('Create Workspace Expense Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
