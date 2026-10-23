import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(req.url);
    const messageId = url.searchParams.get('messageId') || '';
    const index = Number(url.searchParams.get('index'));
    if (!mongoose.isValidObjectId(messageId) || !Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 });
    }
    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    const authorized = message.conversationId
      ? await Conversation.exists({ _id: message.conversationId, participants: user._id })
      : message.projectId && await Project.exists({ _id: message.projectId, members: user._id });
    if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const legacy = url.searchParams.get('legacy') === '1';
    const inline = url.searchParams.get('inline') === '1';
    let filename: string;
    let mimeType: string;
    let remoteBody: ReadableStream<Uint8Array> | null;
    let contentLength: string | undefined;

    if (legacy) {
      if (!message.imageUrl) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
      filename = `image-${message._id}`;
      const dataUrl = /^data:(image\/(?:png|jpeg|gif|webp));base64,([a-z\d+/=]+)$/i.exec(message.imageUrl);
      if (dataUrl) {
        const buffer = Buffer.from(dataUrl[2], 'base64');
        if (buffer.byteLength > 15 * 1024 * 1024) return NextResponse.json({ error: 'Attachment exceeds the allowed size' }, { status: 413 });
        mimeType = dataUrl[1].toLowerCase();
        remoteBody = new ReadableStream({
          start(controller) {
            controller.enqueue(buffer);
            controller.close();
          },
        });
        contentLength = String(buffer.byteLength);
      } else {
        let remoteUrl: URL;
        try {
          remoteUrl = new URL(message.imageUrl);
        } catch {
          return NextResponse.json({ error: 'Attachment storage location is invalid' }, { status: 502 });
        }
        if (!cloudName || remoteUrl.hostname !== 'res.cloudinary.com' || remoteUrl.pathname.split('/')[1] !== cloudName) {
          return NextResponse.json({ error: 'Attachment storage location is invalid' }, { status: 502 });
        }
        const extension = remoteUrl.pathname.split('.').pop()?.toLowerCase();
        const legacyMimes: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
        mimeType = legacyMimes[extension || ''] || '';
        if (!mimeType) return NextResponse.json({ error: 'Unsupported legacy image type' }, { status: 415 });
        const remote = await fetch(remoteUrl, { redirect: 'error' });
        if (!remote.ok || !remote.body) return NextResponse.json({ error: 'Unable to retrieve attachment' }, { status: 502 });
        remoteBody = remote.body;
      }
    } else {
      const attachment = message.attachments[index];
      if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
      let remoteUrl: URL;
      try {
        remoteUrl = new URL(attachment.url);
      } catch {
        return NextResponse.json({ error: 'Attachment storage location is invalid' }, { status: 502 });
      }
      if (!cloudName || remoteUrl.hostname !== 'res.cloudinary.com' || remoteUrl.pathname.split('/')[1] !== cloudName) {
        return NextResponse.json({ error: 'Attachment storage location is invalid' }, { status: 502 });
      }
      const remote = await fetch(remoteUrl, { redirect: 'error' });
      if (!remote.ok || !remote.body) return NextResponse.json({ error: 'Unable to retrieve attachment' }, { status: 502 });
      filename = attachment.fileName.replace(/[\r\n"]/g, '_');
      mimeType = attachment.mimeType;
      contentLength = String(attachment.size);
      remoteBody = remote.body;
    }
    if (inline && !mimeType.startsWith('image/')) {
      return NextResponse.json({ error: 'Inline preview is only available for images' }, { status: 400 });
    }
    const safeFilename = filename.replace(/[\r\n"]/g, '_');
    return new Response(remoteBody, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeFilename.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Chat attachment download failed:', error);
    return NextResponse.json({ error: 'Unable to download attachment' }, { status: 500 });
  }
}
