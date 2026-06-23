import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, requiredSkills, requiredRoles, maxTeamSize } = await req.json();

    if (!title || !description || !category || !maxTeamSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const project = await Project.create({
      ownerId: user._id,
      title,
      description,
      category,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      requiredRoles: Array.isArray(requiredRoles) ? requiredRoles : [],
      maxTeamSize: Number(maxTeamSize),
      status: 'Recruiting',
      members: [user._id], 
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Create Project Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    
    const projects = await Project.find(query)
      .populate('ownerId', 'githubUsername name avatarUrl trustScore')
      .populate('members', 'githubUsername name avatarUrl')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('List Projects Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
