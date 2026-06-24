import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invitation from '@/models/Invitation';
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
    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    
    if (invitation.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { status } = await req.json();
    if (!status || !['Accepted', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Valid status (Accepted or Declined) is required' }, { status: 400 });
    }
    
    invitation.status = status;
    await invitation.save();
    
    if (status === 'Accepted') {
      const project = await Project.findById(invitation.projectId);
      if (project) {
        
        const isMember = project.members.some(m => m.toString() === invitation.userId.toString());
        if (!isMember) {
          if (project.members.length >= project.maxTeamSize) {
            return NextResponse.json({ error: 'Cannot accept invitation. Team is already at maximum capacity.' }, { status: 400 });
          }
          project.members.push(invitation.userId);
          
          
          if (project.members.length >= 2 && project.status === 'Recruiting') {
            project.status = 'Active';
          }
          
          await project.save();
        }
      }
    }
    
    return NextResponse.json({ success: true, invitation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
