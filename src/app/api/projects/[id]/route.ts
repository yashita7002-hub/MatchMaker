import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';
import { createNotifications } from '@/lib/notifications';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const project = await Project.findById(id)
      .populate('ownerId', 'githubUsername name avatarUrl trustScore')
      .populate('members', 'githubUsername name avatarUrl bio skills status trustScore');
      
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, project });
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
    
    if (project.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    const oldStatus = project.status;
    
    project.title = body.title || project.title;
    project.description = body.description || project.description;
    project.category = body.category || project.category;
    project.requiredSkills = Array.isArray(body.requiredSkills) ? body.requiredSkills : project.requiredSkills;
    project.requiredRoles = Array.isArray(body.requiredRoles) ? body.requiredRoles : project.requiredRoles;
    project.maxTeamSize = body.maxTeamSize !== undefined ? Number(body.maxTeamSize) : project.maxTeamSize;
    project.status = body.status || project.status;
    
    await project.save();

    let notifyUserIds: string[] = [];
    let notifications: Awaited<ReturnType<typeof createNotifications>> = [];

    if (body.status && body.status !== oldStatus) {
      const membersToNotify = project.members.filter(m => m.toString() !== user._id.toString());
      notifyUserIds = membersToNotify.map(m => m.toString());

      if (membersToNotify.length > 0) {
        notifications = await createNotifications(
          notifyUserIds,
          'project_status',
          `Project "${project.title}" is now ${project.status}`,
          `/workspace/${project._id}`
        );
      }
    }
    
    return NextResponse.json({ success: true, project, notifyUserIds, notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    
    await Project.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
