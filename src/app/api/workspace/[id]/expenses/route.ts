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
    
    const { title, amount, category, description } = await req.json();
    if (!title || !amount || !category) {
      return NextResponse.json({ error: 'Title, amount, and category are required' }, { status: 400 });
    }
    
    const expense = await Expense.create({
      projectId: project._id,
      title,
      amount: Number(amount),
      category,
      description: description || '',
      loggedBy: user.name,
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
    
    return NextResponse.json({ success: true, expense, notifications, notifyUserIds: otherMembers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
