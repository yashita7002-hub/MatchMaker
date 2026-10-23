import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Invitation from '@/models/Invitation';
import { getSessionUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

import User from '@/models/User';

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
      return NextResponse.json({ error: 'Forbidden. You do not own this project.' }, { status: 403 });
    }
    
    const body = await req.json();
    const { userId, role } = body;
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';

    if (!userId || !role || typeof role !== 'string' || !role.trim()) {
      return NextResponse.json({ error: 'User ID and target role are required' }, { status: 400 });
    }

    if (userId.toString() === user._id.toString()) {
      return NextResponse.json({ error: 'You cannot invite yourself to your own project' }, { status: 400 });
    }

    // Verify candidate exists
    const candidate = await User.findById(userId);
    if (!candidate) {
      return NextResponse.json({ error: 'Target user does not exist' }, { status: 404 });
    }
    
    // Check if candidate is already a member
    if (project.members.some(m => m.toString() === userId.toString())) {
      return NextResponse.json({ error: `${candidate.name || 'User'} is already a team member` }, { status: 400 });
    }
    
    // Check team capacity
    if (project.members.length >= project.maxTeamSize) {
      return NextResponse.json({ error: 'Team is already at maximum capacity' }, { status: 400 });
    }
    
    // Check for existing pending invitation
    const existingInvite = await Invitation.findOne({
      projectId: project._id,
      userId,
      status: 'Pending',
    });
    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation is already pending for this user' }, { status: 400 });
    }
    
    const trimmedRole = role.trim();

    const invite = await Invitation.create({
      projectId: project._id,
      userId,
      role: trimmedRole,
      message,
      status: 'Pending',
    });

    const notificationText = message
      ? `${user.name} invited you to join "${project.title}" as ${trimmedRole}: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`
      : `${user.name} invited you to join "${project.title}" as ${trimmedRole}`;

    const notification = await createNotification(
      userId,
      'invitation',
      notificationText,
      '/dashboard?section=applications'
    );
    
    return NextResponse.json({ success: true, invitation: invite, notification });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
