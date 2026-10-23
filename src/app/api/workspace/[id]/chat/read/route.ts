import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';
import { protectChatMessage } from '@/lib/chat-message-response';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: projectId } = await params;
    if (!mongoose.isValidObjectId(projectId) || !(await Project.exists({ _id: projectId, members: user._id }))) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const { messageId } = await req.json();
    if (typeof messageId !== 'string' || !mongoose.isValidObjectId(messageId)) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }
    const message = await Message.findOneAndUpdate(
      { _id: messageId, projectId, userId: { $ne: user._id } },
      { $addToSet: { deliveredTo: user._id, readBy: user._id } },
      { new: true },
    ).populate('replyTo', 'senderName text imageUrl attachments isDeleted');
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    return NextResponse.json({ message: protectChatMessage(message.toObject()) });
  } catch (error) {
    console.error('Project message read receipt failed:', error);
    return NextResponse.json({ error: 'Unable to record read receipt' }, { status: 500 });
  }
}
