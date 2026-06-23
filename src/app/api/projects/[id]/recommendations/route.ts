import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Application from '@/models/Application';
import Invitation from '@/models/Invitation';
import { getSessionUser } from '@/lib/auth';
import { getRecommendations } from '@/lib/recommendations';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    
    
    const excludeIds = project.members.map(m => m.toString());
    
    
    const pendingApps = await Application.find({ projectId: project._id, status: 'Pending' });
    pendingApps.forEach(app => excludeIds.push(app.userId.toString()));
    
    
    const pendingInvites = await Invitation.find({ projectId: project._id, status: 'Pending' });
    pendingInvites.forEach(inv => excludeIds.push(inv.userId.toString()));
    
    
    const uniqueExcludeIds = Array.from(new Set(excludeIds));
    
    const recommendations = await getRecommendations(
      project.requiredSkills,
      project.requiredRoles,
      uniqueExcludeIds
    );
    
    return NextResponse.json({ success: true, recommendations });
  } catch (error: any) {
    console.error('Recommendations API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
