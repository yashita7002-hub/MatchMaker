import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Message from '@/models/Message';
import Discussion from '@/models/Discussion';
import KanbanTask from '@/models/KanbanTask';
import Expense from '@/models/Expense';
import ProjectResource from '@/models/ProjectResource';
import { getSessionUser } from '@/lib/auth';
import { protectChatMessage } from '@/lib/chat-message-response';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const project = await Project.findById(id)
      .populate('ownerId', 'githubUsername name avatarUrl trustScore')
      .populate('members', 'githubUsername name avatarUrl trustScore');
      
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    
    const isMember = project.members.some(m => m._id.toString() === user._id.toString());
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this project team.' }, { status: 403 });
    }
    
    
    await Message.updateMany(
      { projectId: id, userId: { $ne: user._id } },
      { $addToSet: { deliveredTo: user._id, readBy: user._id } },
    );
    const messageDocuments = await Message.find({ projectId: id })
      .populate('replyTo', 'senderName text imageUrl attachments isDeleted')
      .sort({ createdAt: 1 });
    const messages = messageDocuments.map(message => protectChatMessage(message.toObject()));
    const discussions = await Discussion.find({ projectId: id }).sort({ createdAt: -1 });
    const tasks = await KanbanTask.find({ projectId: id }).sort({ createdAt: 1 });
    let expenses = await Expense.find({ projectId: id });
    const currentMemberIds = project.members.map(member => member._id);
    let migratedLegacyExpenses = false;
    for (const expense of expenses) {
      if (expense.participants.length === 0 && currentMemberIds.length > 0) {
        const totalCents = Math.round(expense.amount * 100);
        const centsPerMember = Math.floor(totalCents / currentMemberIds.length);
        let remainingCents = totalCents;
        expense.participants = currentMemberIds.map((memberId, index) => {
          const shareCents = index === currentMemberIds.length - 1 ? remainingCents : centsPerMember;
          remainingCents -= shareCents;
          return {
            userId: memberId,
            shareAmount: shareCents / 100,
            status: 'Pending' as const,
          };
        });
        await expense.save();
        migratedLegacyExpenses = true;
      }
    }
    if (migratedLegacyExpenses) {
      expenses = await Expense.find({ projectId: id });
    }
    await Expense.populate(expenses, [
      { path: 'participants.userId', select: 'name githubUsername avatarUrl' },
      { path: 'participants.verifiedBy', select: 'name githubUsername avatarUrl' },
    ]);
    expenses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const resources = await ProjectResource.find({ projectId: id }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      project,
      messages,
      discussions,
      tasks,
      expenses,
      resources,
    });
  } catch (error) {
    console.error('Workspace Load Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
