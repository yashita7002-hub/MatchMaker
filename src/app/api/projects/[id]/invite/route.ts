import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Invitation from '@/models/Invitation';
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
    
    if (project.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and target role are required' }, { status: 400 });
    }
    
    
    if (project.members.some(m => m.toString() === userId.toString())) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
    }
    
    
    const existingInvite = await Invitation.findOne({
      projectId: project._id,
      userId,
      status: 'Pending',
    });
    if (existingInvite) {
      return NextResponse.json({ error: 'Invitation already pending for this user' }, { status: 400 });
    }
    
    const invite = await Invitation.create({
      projectId: project._id,
      userId,
      role,
      status: 'Pending',
    });
    
    return NextResponse.json({ success: true, invitation: invite });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
