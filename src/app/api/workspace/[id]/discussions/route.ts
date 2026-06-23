import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Discussion from '@/models/Discussion';
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
    
    const { title, category } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'Thread title is required' }, { status: 400 });
    }
    
    const thread = await Discussion.create({
      projectId: project._id,
      title,
      category: category || 'General',
      creatorId: user._id,
      creatorName: user.name,
      replies: [],
    });
    
    return NextResponse.json({ success: true, thread });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
