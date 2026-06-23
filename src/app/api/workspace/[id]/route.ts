import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Message from '@/models/Message';
import Discussion from '@/models/Discussion';
import KanbanTask from '@/models/KanbanTask';
import Expense from '@/models/Expense';
import { getSessionUser } from '@/lib/auth';

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
    
    
    const messages = await Message.find({ projectId: id }).sort({ createdAt: 1 });
    const discussions = await Discussion.find({ projectId: id }).sort({ createdAt: -1 });
    const tasks = await KanbanTask.find({ projectId: id }).sort({ createdAt: 1 });
    const expenses = await Expense.find({ projectId: id }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      project,
      messages,
      discussions,
      tasks,
      expenses,
    });
  } catch (error: any) {
    console.error('Workspace Load Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
