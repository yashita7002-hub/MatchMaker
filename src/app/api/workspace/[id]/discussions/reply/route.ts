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
    
    const { threadId, text } = await req.json();
    if (!threadId || !text) {
      return NextResponse.json({ error: 'Thread ID and reply text are required' }, { status: 400 });
    }
    
    const thread = await Discussion.findById(threadId);
    if (!thread || thread.projectId.toString() !== project._id.toString()) {
      return NextResponse.json({ error: 'Discussion thread not found' }, { status: 404 });
    }
    
    
    const newReply = {
      userId: user._id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      text,
      createdAt: new Date(),
    };
    
    thread.replies.push(newReply as any);
    await thread.save();
    
    
    return NextResponse.json({ success: true, thread });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
