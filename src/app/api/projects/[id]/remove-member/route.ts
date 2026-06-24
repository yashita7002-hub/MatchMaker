import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

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
    
    // Only the project owner can remove members
    if (project.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Only the project owner can remove members' }, { status: 403 });
    }
    
    const { memberId, reason } = await req.json();
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }
    
    // Cannot remove yourself (the owner)
    if (memberId === user._id.toString()) {
      return NextResponse.json({ error: 'You cannot remove yourself from the project' }, { status: 400 });
    }
    
    // Check if the user is actually a member
    const memberIndex = project.members.findIndex((m: any) => m.toString() === memberId);
    if (memberIndex === -1) {
      return NextResponse.json({ error: 'User is not a member of this project' }, { status: 400 });
    }
    
    // Remove the member
    project.members.splice(memberIndex, 1);
    await project.save();
    
    // Get the removed member's info for the notification message
    const removedUser = await User.findById(memberId);
    const removedName = removedUser?.name || 'A member';
    
    // Create a notification for the removed member
    const reasonText = reason ? ` Reason: ${reason}` : '';
    const notification = await createNotification(
      memberId,
      'member_removed',
      `You have been removed from project "${project.title}".${reasonText}`,
      '/dashboard'
    );
    
    // Also notify remaining members
    const remainingMembers = project.members.filter((m: any) => m.toString() !== user._id.toString());
    const remainingNotifications = [];
    for (const rm of remainingMembers) {
      const n = await createNotification(
        rm.toString(),
        'member_removed',
        `${removedName} has been removed from project "${project.title}".`,
        `/workspace/${project._id}`
      );
      remainingNotifications.push(n);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${removedName} has been removed from the project.`,
      notification,
      remainingNotifications,
      removedMemberId: memberId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
