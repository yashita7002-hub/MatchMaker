import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Message from '@/models/Message';
import User from '@/models/User';
import ChatUpload from '@/models/ChatUpload';
import mongoose from 'mongoose';
import { isValidChatAttachment, isValidLegacyChatImage } from '@/lib/chat-attachments';
import { protectChatMessage } from '@/lib/chat-message-response';
import { getSessionUser } from '@/lib/auth';
import { createNotifications } from '@/lib/notifications';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id) || !(await Project.exists({ _id: id, members: user._id }))) {
      return NextResponse.json({ error: 'Project chat not found' }, { status: 404 });
    }

    await Message.updateMany(
      { projectId: id, userId: { $ne: user._id } },
      { $addToSet: { deliveredTo: user._id, readBy: user._id } },
    );
    const messages = await Message.find({ projectId: id })
      .populate('replyTo', 'senderName text imageUrl attachments isDeleted')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ messages: messages.reverse().map(message => protectChatMessage(message)) });
  } catch (error) {
    console.error('Project chat history load failed:', error);
    return NextResponse.json({ error: 'Unable to load project messages' }, { status: 500 });
  }
}

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
    
    if (!project.members.some(m => m.toString() === user._id.toString())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : '';
    const attachmentIds: unknown[] = Array.isArray(body.attachmentIds) ? body.attachmentIds : [];
    const replyToId = typeof body.replyToId === 'string' ? body.replyToId : '';
    if (!text && !imageUrl && attachmentIds.length === 0) {
      return NextResponse.json({ error: 'Message text or attachment is required' }, { status: 400 });
    }
    if (text.length > 5000 || attachmentIds.length > 5 || new Set(attachmentIds).size !== attachmentIds.length) {
      return NextResponse.json({ error: 'Message exceeds the allowed limits' }, { status: 400 });
    }
    if (imageUrl && !isValidLegacyChatImage(imageUrl)) {
      return NextResponse.json({ error: 'Legacy image URL is invalid' }, { status: 400 });
    }
    const validAttachmentIds = attachmentIds.filter((attachmentId): attachmentId is string => typeof attachmentId === 'string' && mongoose.isValidObjectId(attachmentId));
    if (validAttachmentIds.length !== attachmentIds.length) {
      return NextResponse.json({ error: 'One or more attachments are invalid' }, { status: 400 });
    }
    const uploadRecords = validAttachmentIds.length > 0
      ? await ChatUpload.find({ _id: { $in: validAttachmentIds }, userId: user._id, projectId: project._id, expiresAt: { $gt: new Date() } }).lean()
      : [];
    const uploadById = new Map(uploadRecords.map(upload => [upload._id.toString(), upload]));
    const safeAttachments = validAttachmentIds.map(attachmentId => uploadById.get(attachmentId))
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
      if (!/^[a-f\d]{24}$/i.test(replyToId)) return NextResponse.json({ error: 'Invalid reply target' }, { status: 400 });
      replyTo = await Message.findOne({ _id: replyToId, projectId: project._id }).select('_id userId');
      if (!replyTo) return NextResponse.json({ error: 'Reply target not found' }, { status: 404 });
    }
    
    const createdMessage = await Message.create({
      projectId: project._id,
      userId: user._id,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      text,
      imageUrl,
      attachments: safeAttachments,
      replyTo: replyTo?._id,
      deliveredTo: [user._id],
      readBy: [user._id],
    });

    const otherMembers = project.members
      .filter(m => m.toString() !== user._id.toString())
      .map(m => m.toString());
    const mentionedNames = [...text.matchAll(/@([\w-]+)/g)].map(match => match[1].toLowerCase());
    const mentionedUsers = mentionedNames.length > 0
      ? (await User.find({ _id: { $in: otherMembers } }).select('_id githubUsername'))
        .filter(member => mentionedNames.includes(member.githubUsername.toLowerCase()))
      : [];
    const mentionedIds = new Set(mentionedUsers.map(member => member._id.toString()));
    const mentionedRecipients = otherMembers.filter(id => mentionedIds.has(id));
    const replyRecipientId = replyTo && replyTo.userId.toString() !== user._id.toString()
      && !mentionedIds.has(replyTo.userId.toString())
      ? replyTo.userId.toString()
      : null;
    const regularRecipients = otherMembers.filter(id => !mentionedIds.has(id) && id !== replyRecipientId);
    const notificationLink = `/workspace/${project._id}?tab=chat&message=${createdMessage._id}`;
    const notifications = [
      ...await createNotifications(
        mentionedRecipients,
        'mention',
        `${user.name} mentioned you in ${project.title}`,
        notificationLink,
      ),
      ...await createNotifications(
        replyRecipientId ? [replyRecipientId] : [],
        'reply',
        `${user.name} replied to your message in ${project.title}`,
        notificationLink,
      ),
      ...await createNotifications(
        regularRecipients,
        'message',
      `${user.name} sent a message in ${project.title}`,
        notificationLink,
      ),
    ];
    try {
      await ChatUpload.deleteMany({ _id: { $in: validAttachmentIds }, userId: user._id });
    } catch (error) {
      console.error('Consumed project chat upload cleanup failed:', error);
    }
    const message = await Message.findById(createdMessage._id)
      .populate('replyTo', 'senderName text imageUrl attachments isDeleted')
      .lean();
    
    return NextResponse.json({
      success: true,
      message: message ? protectChatMessage(message) : null,
      notifyUserIds: otherMembers,
      notifications,
    });
  } catch (error) {
    console.error('Project chat message send failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
