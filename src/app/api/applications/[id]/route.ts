import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Application from '@/models/Application';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    const project = await Project.findById(application.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (project.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { status } = await req.json();
    if (!status || !['Accepted', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid status (Accepted or Rejected) is required' }, { status: 400 });
    }
    
    application.status = status;
    await application.save();
    
    if (status === 'Accepted') {
      
      const isMember = project.members.some(m => m.toString() === application.userId.toString());
      if (!isMember) {
        if (project.members.length >= project.maxTeamSize) {
          return NextResponse.json({ error: 'Cannot accept application. Team is already at maximum capacity.' }, { status: 400 });
        }
        
        project.members.push(application.userId);
        
        
        if (project.members.length >= 2 && project.status === 'Recruiting') {
          project.status = 'Active';
        }
        
        await project.save();
      }
    }
    
    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
