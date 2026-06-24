import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import Review from '@/models/Review';

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    await connectDB();
    const { username } = await params;
    
    const user = await User.findOne({ githubUsername: username });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch projects where user is owner or member
    const projects = await Project.find({
      $or: [{ ownerId: user._id }, { members: user._id }]
    }).populate('ownerId', 'githubUsername name').sort({ createdAt: -1 });

    // Fetch reviews received by this user, populate reviewer and project
    const reviews = await Review.find({ revieweeId: user._id })
      .populate('reviewerId', 'githubUsername name avatarUrl')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, user, projects, reviews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
