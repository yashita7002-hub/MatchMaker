import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Message from '@/models/Message';
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
    
    const { text, imageUrl } = await req.json();
    if (!text && !imageUrl) {
      return NextResponse.json({ error: 'Message text or image is required' }, { status: 400 });
    }
    
    const message = await Message.create({
      projectId: project._id,
      userId: user._id,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      text: text || '',
      imageUrl: imageUrl || '',
    });
    
    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
