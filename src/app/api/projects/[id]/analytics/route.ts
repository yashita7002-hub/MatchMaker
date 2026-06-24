import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getProjectAnalytics, getTopContributors, getTeamVelocity } from '@/lib/analytics';
import { getSessionUser } from '@/lib/auth';
import Project from '@/models/Project';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user has access to this project
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isOwner = project.ownerId.toString() === user._id.toString();
    const isMember = project.members.some((m: any) => m.toString() === user._id.toString());

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get analytics
    const analytics = await getProjectAnalytics(id);
    const topContributors = await getTopContributors(id, 5);
    const teamVelocity = await getTeamVelocity(id, 7);

    return NextResponse.json({
      success: true,
      analytics,
      topContributors,
      teamVelocity,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
