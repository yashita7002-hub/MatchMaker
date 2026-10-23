import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import ProjectResource from '@/models/ProjectResource';
import { getSessionUser } from '@/lib/auth';

const resourceTypes = ['Code', 'Design', 'Docs', 'Infra', 'Other'] as const;

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

    if (!project.members.some(member => member.toString() === user._id.toString())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, url, type, description } = await req.json();
    if (typeof name !== 'string' || !name.trim() || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Resource name and URL are required' }, { status: 400 });
    }
    if (description !== undefined && typeof description !== 'string') {
      return NextResponse.json({ error: 'Resource description must be text' }, { status: 400 });
    }

    const resourceType = resourceTypes.find(allowedType => allowedType === type);
    if (!resourceType) {
      return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Enter a valid resource URL' }, { status: 400 });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Resource URL must use HTTP or HTTPS' }, { status: 400 });
    }

    const resource = await ProjectResource.create({
      projectId: project._id,
      name: name.trim(),
      url: parsedUrl.toString(),
      description: description?.trim() || '',
      type: resourceType,
    });

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error) {
    console.error('Create Workspace Resource Error:', error);
    return NextResponse.json({ error: 'Failed to save resource' }, { status: 500 });
  }
}
