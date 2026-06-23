import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { status, skills, roles, bio, name } = await req.json();
    
    const targetUser = await User.findById(user._id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (status !== undefined) targetUser.status = status;
    if (skills !== undefined && Array.isArray(skills)) targetUser.skills = skills;
    if (roles !== undefined && Array.isArray(roles)) targetUser.roles = roles;
    if (bio !== undefined) targetUser.bio = bio;
    if (name !== undefined) targetUser.name = name;
    
    await targetUser.save();
    
    return NextResponse.json({ success: true, user: targetUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
