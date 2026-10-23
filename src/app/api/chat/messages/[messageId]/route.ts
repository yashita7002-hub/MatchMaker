import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';
import { protectChatMessage } from '@/lib/chat-message-response';

type RouteContext = { params: Promise<{ messageId: string }> };

async function canAccessMessage(message: { projectId?: unknown; conversationId?: unknown }, userId: string) {
  if (message.conversationId) {
    return Boolean(await Conversation.exists({ _id: message.conversationId, participants: userId }));
  }
  if (message.projectId) {
    return Boolean(await Project.exists({ _id: message.projectId, members: userId }));
  }
  return false;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { messageId } = await params;
    if (!mongoose.isValidObjectId(messageId)) return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    const message = await Message.findById(messageId);
    if (!message || !(await canAccessMessage(message, user._id.toString()))) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const body = await req.json();
    if (body.action === 'edit') {
      if (message.userId.toString() !== user._id.toString() || message.isDeleted) {
        return NextResponse.json({ error: 'Only the sender can edit this message' }, { status: 403 });
      }
      if (typeof body.text !== 'string' || !body.text.trim() || body.text.trim().length > 5000) {
        return NextResponse.json({ error: 'Message text must be between 1 and 5000 characters' }, { status: 400 });
      }
      message.text = body.text.trim();
      message.editedAt = new Date();
    } else if (body.action === 'delete') {
      if (message.userId.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'Only the sender can delete this message' }, { status: 403 });
      }
      message.text = '';
      message.imageUrl = '';
      message.attachments = [];
      message.isDeleted = true;
    } else if (body.action === 'react') {
      const emoji = typeof body.emoji === 'string' ? body.emoji : '';
      if (!emoji || emoji.length > 16) return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
      const existingIndex = message.reactions.findIndex(reaction => reaction.userId.toString() === user._id.toString());
      if (existingIndex >= 0 && message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else if (existingIndex >= 0) {
        message.reactions[existingIndex].emoji = emoji;
      } else {
        message.reactions.push({ userId: user._id, emoji });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported message action' }, { status: 400 });
    }

    await message.save();
    const updatedMessage = await Message.findById(message._id)
      .populate('replyTo', 'senderName text imageUrl attachments isDeleted')
      .lean();
    return NextResponse.json({ message: updatedMessage ? protectChatMessage(updatedMessage) : null });
  } catch (error) {
    console.error('Message update failed:', error);
    return NextResponse.json({ error: 'Unable to update message' }, { status: 500 });
  }
}
