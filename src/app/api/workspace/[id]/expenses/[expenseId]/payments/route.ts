import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Expense from '@/models/Expense';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, expenseId } = await params;
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.members.some(member => member.toString() === user._id.toString())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expense = await Expense.findOne({ _id: expenseId, projectId: project._id });
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const { action, participantId } = await req.json();
    if (action === 'claim') {
      const updated = await Expense.findOneAndUpdate(
        {
          _id: expense._id,
          projectId: project._id,
          participants: {
            $elemMatch: {
              userId: user._id,
              status: { $in: ['Pending', 'Rejected'] },
            },
          },
        },
        {
          $set: {
            'participants.$.status': 'Awaiting Verification',
            'participants.$.claimedAt': new Date(),
            'participants.$.verifiedBy': null,
            'participants.$.verifiedAt': null,
          },
        },
        { new: true }
      );

      if (!updated) {
        const userShare = expense.participants.find(share => share.userId.toString() === user._id.toString());
        if (!userShare) {
          return NextResponse.json({ error: 'You are not assigned a share for this expense' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Your payment is already awaiting verification or has been paid' }, { status: 409 });
      }

      await updated.populate('participants.userId', 'name githubUsername avatarUrl');
      await updated.populate('participants.verifiedBy', 'name githubUsername avatarUrl');
      return NextResponse.json({ success: true, expense: updated });
    }

    if (action !== 'confirm' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid payment action' }, { status: 400 });
    }
    if (typeof participantId !== 'string') {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    const isProjectOwner = project.ownerId.toString() === user._id.toString();
    if (!isProjectOwner) {
      return NextResponse.json({ error: 'Only the project team leader can verify payments' }, { status: 403 });
    }

    const updated = await Expense.findOneAndUpdate(
      {
        _id: expense._id,
        projectId: project._id,
        participants: {
          $elemMatch: {
            userId: participantId,
            status: 'Awaiting Verification',
          },
        },
      },
      {
        $set: {
          'participants.$.status': action === 'confirm' ? 'Paid' : 'Rejected',
          'participants.$.verifiedBy': user._id,
          'participants.$.verifiedAt': new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'No payment claim is awaiting verification for this member' }, { status: 409 });
    }

    await updated.populate('participants.userId', 'name githubUsername avatarUrl');
    await updated.populate('participants.verifiedBy', 'name githubUsername avatarUrl');
    return NextResponse.json({ success: true, expense: updated });
  } catch (error) {
    console.error('Update Expense Payment Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update payment status' }, { status: 500 });
  }
}
