import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import ChatUpload from '@/models/ChatUpload';
import { getSessionUser } from '@/lib/auth';
import { createNotifications } from '@/lib/notifications';
import { isValidChatAttachment } from '@/lib/chat-attachments';
import { protectChatMessage } from '@/lib/chat-message-response';

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { conversationId } = await params;
    if (!mongoose.isValidObjectId(conversationId)) return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });

    const conversation = await Conversation.findOne({ _id: conversationId, participants: user._id }).select('_id');
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    await Message.updateMany(
      { conversationId, userId: { $ne: user._id } },
      { $addToSet: { deliveredTo: user._id, readBy: user._id } },
    );
    const messages = await Message.find({ conversationId })
      .populate('replyTo', 'senderName text imageUrl attachments isDeleted')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ messages: messages.reverse().map(message => protectChatMessage(message)) });
  } catch (error) {
    console.error('Direct message history load failed:', error);
    return NextResponse.json({ error: 'Unable to load messages' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { conversationId } = await params;
    if (!mongoose.isValidObjectId(conversationId)) return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 });
    const conversation = await Conversation.findOne({ _id: conversationId, participants: user._id });
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const body = await req.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const attachmentIds: unknown[] = Array.isArray(body.attachmentIds) ? body.attachmentIds : [];
    const replyToId = typeof body.replyToId === 'string' ? body.replyToId : '';
    if (!text && attachmentIds.length === 0) return NextResponse.json({ error: 'Message text or attachment is required' }, { status: 400 });
    if (text.length > 5000 || attachmentIds.length > 5 || new Set(attachmentIds).size !== attachmentIds.length) {
      return NextResponse.json({ error: 'Message exceeds the allowed limits' }, { status: 400 });
    }
    const validAttachmentIds = attachmentIds.filter((id): id is string => typeof id === 'string' && mongoose.isValidObjectId(id));
    if (validAttachmentIds.length !== attachmentIds.length) {
      return NextResponse.json({ error: 'One or more attachments are invalid' }, { status: 400 });
    }

    const uploadRecords = validAttachmentIds.length > 0
      ? await ChatUpload.find({ _id: { $in: validAttachmentIds }, userId: user._id, conversationId, expiresAt: { $gt: new Date() } }).lean()
      : [];
    const uploadById = new Map(uploadRecords.map(upload => [upload._id.toString(), upload]));
    const safeAttachments = validAttachmentIds.map(id => uploadById.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map(item => ({
        fileName: item.fileName,
        mimeType: item.mimeType,
        size: item.size,
        url: item.url,
        publicId: item.publicId,
        resourceType: item.resourceType,
      }))
      .filter(item => isValidChatAttachment(item, user._id.toString()));
    if (safeAttachments.length !== validAttachmentIds.length) {
      return NextResponse.json({ error: 'One or more attachments are invalid or expired' }, { status: 400 });
    }

    let replyTo;
    if (replyToId) {
      if (!mongoose.isValidObjectId(replyToId)) return NextResponse.json({ error: 'Invalid reply target' }, { status: 400 });
      replyTo = await Message.findOne({ _id: replyToId, conversationId }).select('_id');
      if (!replyTo) return NextResponse.json({ error: 'Reply target not found' }, { status: 404 });
    }
    const message = await Message.create({
      conversationId,
      userId: user._id,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      text,
      attachments: safeAttachments,
      replyTo: replyTo?._id,
      deliveredTo: [user._id],
      readBy: [user._id],
    });
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    try {
      await ChatUpload.deleteMany({ _id: { $in: validAttachmentIds }, userId: user._id });
    } catch (error) {
      console.error('Consumed chat upload cleanup failed:', error);
    }

    const recipientIds = conversation.participants
      .filter(id => id.toString() !== user._id.toString())
      .map(id => id.toString());
    const notifications = await createNotifications(
      recipientIds,
      replyTo ? 'reply' : 'message',
      replyTo
        ? `${user.name} replied to your message${text ? `: ${text.slice(0, 90)}` : ''}`
        : `${user.name} sent you a message${text ? `: ${text.slice(0, 90)}` : ''}`,
      `/messages?conversation=${conversation._id}`,
    );

    const populatedMessage = await Message.findById(message._id)
      .populate('replyTo', 'senderName text imageUrl attachments isDeleted')
      .lean();
    return NextResponse.json({
      success: true,
      message: populatedMessage ? protectChatMessage(populatedMessage) : null,
      notifications,
    });
  } catch (error) {
    console.error('Direct message send failed:', error);
    return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });
  }
}
