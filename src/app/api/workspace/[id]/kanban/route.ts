import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import KanbanTask from '@/models/KanbanTask';
import { getSessionUser } from '@/lib/auth';

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
    
    const { title, description, assignedUserId, assignedUserName, dueDate } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }
    
    const task = await KanbanTask.create({
      projectId: project._id,
      title,
      description: description || '',
      status: 'todo',
      assignedUserId: assignedUserId || null,
      assignedUserName: assignedUserName || '',
      dueDate: dueDate || '',
    });
    
    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    
    const { taskId, status, title, description, assignedUserId, assignedUserName, dueDate } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }
    
    const task = await KanbanTask.findById(taskId);
    if (!task || task.projectId.toString() !== project._id.toString()) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    if (status !== undefined) task.status = status;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedUserId !== undefined) task.assignedUserId = assignedUserId || null;
    if (assignedUserName !== undefined) task.assignedUserName = assignedUserName || '';
    if (dueDate !== undefined) task.dueDate = dueDate || '';
    
    await task.save();
    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
