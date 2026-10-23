import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conversation from '@/models/Conversation';
import Message, { IMessage } from '@/models/Message';
import Project from '@/models/Project';
import SavedMessage from '@/models/SavedMessage';
import { getSessionUser } from '@/lib/auth';
import { protectChatMessage } from '@/lib/chat-message-response';

async function canAccess(messageId: string, userId: string) {
  const message = await Message.findById(messageId).select('projectId conversationId');
  if (!message) return false;
  if (message.conversationId) return Boolean(await Conversation.exists({ _id: message.conversationId, participants: userId }));
  return Boolean(message.projectId && await Project.exists({ _id: message.projectId, members: userId }));
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const saved = await SavedMessage.find({ userId: user._id })
      .populate<{ messageId: IMessage | null }>({ path: 'messageId', populate: { path: 'replyTo', select: 'senderName text' } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({
      saved: saved.map(item => ({
        ...item,
        messageId: item.messageId ? protectChatMessage(item.messageId) : null,
      })),
    });
  } catch (error) {
    console.error('Saved messages load failed:', error);
    return NextResponse.json({ error: 'Unable to load saved messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { messageId } = await req.json();
    if (typeof messageId !== 'string' || !mongoose.isValidObjectId(messageId)) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }
    if (!(await canAccess(messageId, user._id.toString()))) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    await SavedMessage.updateOne(
      { userId: user._id, messageId },
      { $setOnInsert: { userId: user._id, messageId } },
      { upsert: true },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save message failed:', error);
    return NextResponse.json({ error: 'Unable to save message' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const messageId = new URL(req.url).searchParams.get('messageId');
    if (!messageId || !mongoose.isValidObjectId(messageId)) return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    await SavedMessage.deleteOne({ userId: user._id, messageId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsave message failed:', error);
    return NextResponse.json({ error: 'Unable to remove saved message' }, { status: 500 });
  }
}
