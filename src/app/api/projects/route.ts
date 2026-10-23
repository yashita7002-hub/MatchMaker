import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';

import { setupProjectGitHub } from '@/lib/github';

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

    await project.populate('ownerId', 'githubUsername name avatarUrl trustScore');

    let githubSetupResult: { success: boolean; repositoryUrl?: string; error?: string } | null = null;
    const githubToken = process.env.GITHUB_TOKEN;

    if (githubToken && user.githubUsername) {
      try {
        githubSetupResult = await setupProjectGitHub(
          project._id.toString(),
          project.title,
          project.description,
          user.githubUsername,
          githubToken,
          []
        );
      } catch (githubError: any) {
        console.error('GitHub setup error during project pitch:', githubError.message);
        githubSetupResult = {
          success: false,
          error: githubError.message || 'GitHub repository creation failed',
        };
      }
    } else if (!githubToken) {
      githubSetupResult = {
        success: false,
        error: 'GITHUB_TOKEN environment variable is not configured',
      };
    } else if (!user.githubUsername) {
      githubSetupResult = {
        success: false,
        error: 'Creator does not have a linked GitHub username',
      };
    }

    return NextResponse.json({
      success: true,
      project,
      githubSetup: githubSetupResult,
    });
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
