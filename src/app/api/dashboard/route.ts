import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Application from '@/models/Application';
import Invitation from '@/models/Invitation';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    
    const ownedProjects = await Project.find({ ownerId: user._id }).populate('members', 'githubUsername name avatarUrl trustScore');
    const ownedProjectIds = ownedProjects.map(p => p._id);
    
    
    const incomingApplications = await Application.find({
      projectId: { $in: ownedProjectIds },
      status: 'Pending',
    }).populate('userId', 'githubUsername name avatarUrl trustScore bio skills')
      .populate('projectId', 'title');
      
    
    const outgoingInvitations = await Invitation.find({
      projectId: { $in: ownedProjectIds },
      status: 'Pending',
    }).populate('userId', 'githubUsername name avatarUrl trustScore')
      .populate('projectId', 'title');
      
    
    const myApplications = await Application.find({ userId: user._id })
      .populate('projectId', 'title ownerId status')
      .sort({ createdAt: -1 });
      
    
    const myInvitations = await Invitation.find({ userId: user._id, status: 'Pending' })
      .populate({
        path: 'projectId',
        select: 'title ownerId requiredSkills status',
        populate: {
          path: 'ownerId',
          select: 'githubUsername name avatarUrl'
        }
      })
      .sort({ createdAt: -1 });
      
    
    const activeTeams = await Project.find({
      members: user._id,
      ownerId: { $ne: user._id },
    }).populate('ownerId', 'githubUsername name avatarUrl')
      .populate('members', 'githubUsername name avatarUrl');
      
    return NextResponse.json({
      success: true,
      ownedProjects,
      incomingApplications,
      outgoingInvitations,
      myApplications,
      myInvitations,
      activeTeams,
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
