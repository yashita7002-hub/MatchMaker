import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';
import { createNotifications } from '@/lib/notifications';
import { setupProjectGitHub } from '@/lib/github';
import { updateProjectAnalytics } from '@/lib/analytics';

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
    const project = await Project.findById(id).populate('members', 'githubUsername');
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
    let githubSetupResult = null;

    // Handle status change to Active
    if (body.status && body.status !== oldStatus && body.status === 'Active') {
      // Trigger GitHub setup
      try {
        const ownerData = await User.findById(user._id);
        const githubToken = process.env.GITHUB_TOKEN;
        
        if (ownerData && githubToken) {
          const teamMembers = await Promise.all(
            project.members
              .filter((m: any) => m._id.toString() !== user._id.toString())
              .map(async (memberId: any) => {
                const member = await User.findById(memberId);
                return {
                  githubUsername: member?.githubUsername,
                  userId: member?._id.toString(),
                };
              })
          );

          githubSetupResult = await setupProjectGitHub(
            project._id.toString(),
            project.title,
            project.description,
            ownerData.githubUsername,
            githubToken,
            teamMembers.filter((m: any) => m.githubUsername)
          );

          console.log('GitHub setup result:', githubSetupResult);
        }
      } catch (githubError: any) {
        console.error('GitHub setup error:', githubError.message);
        // Don't fail the request, just log the error
      }

      // Notify members about status change
      const membersToNotify = project.members.filter((m: any) => m._id?.toString() !== user._id.toString());
      notifyUserIds = membersToNotify.map((m: any) => m._id?.toString() || m.toString());

      if (membersToNotify.length > 0) {
        let notificationMessage = `Project "${project.title}" is now ${project.status}`;
        if (githubSetupResult?.success) {
          notificationMessage += ` and a GitHub repository has been created!`;
        }

        notifications = await createNotifications(
          notifyUserIds,
          'project_status',
          notificationMessage,
          `/workspace/${project._id}`
        );
      }

      // Update analytics
      try {
        await updateProjectAnalytics(id);
      } catch (analyticsError: any) {
        console.error('Analytics update error:', analyticsError.message);
      }
    } else if (body.status && body.status !== oldStatus) {
      const membersToNotify = project.members.filter((m: any) => m._id?.toString() !== user._id.toString());
      notifyUserIds = membersToNotify.map((m: any) => m._id?.toString() || m.toString());

      if (membersToNotify.length > 0) {
        notifications = await createNotifications(
          notifyUserIds,
          'project_status',
          `Project "${project.title}" is now ${project.status}`,
          `/workspace/${project._id}`
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      project,
      notifyUserIds,
      notifications,
      githubSetup: githubSetupResult,
    });
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
