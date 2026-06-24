import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Application from '@/models/Application';
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
    
    
    if (project.members.some(m => m.toString() === user._id.toString())) {
      return NextResponse.json({ error: 'Already a team member' }, { status: 400 });
    }
    
    if (project.members.length >= project.maxTeamSize) {
      return NextResponse.json({ error: 'Team is already at maximum capacity' }, { status: 400 });
    }
    
    
    const existingApp = await Application.findOne({
      projectId: project._id,
      userId: user._id,
      status: 'Pending',
    });
    if (existingApp) {
      return NextResponse.json({ error: 'Application already pending' }, { status: 400 });
    }
    
    const { role, coverLetter } = await req.json();
    if (!role) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 });
    }
    
    const app = await Application.create({
      projectId: project._id,
      userId: user._id,
      role,
      coverLetter: coverLetter || '',
      status: 'Pending',
    });
    
    return NextResponse.json({ success: true, application: app });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
