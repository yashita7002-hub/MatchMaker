import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberFields = 'githubUsername name avatarUrl trustScore';

    const ownedProjects = await Project.find({ ownerId: user._id })
      .populate('ownerId', memberFields)
      .populate('members', memberFields)
      .sort({ updatedAt: -1 });

    const teamProjects = await Project.find({
      members: user._id,
      ownerId: { $ne: user._id },
    })
      .populate('ownerId', memberFields)
      .populate('members', memberFields)
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      ownedProjects,
      teamProjects,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('My Projects API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
