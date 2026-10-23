import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conversation from '@/models/Conversation';
import Project from '@/models/Project';
import ChatUpload from '@/models/ChatUpload';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_SIZE = 15 * 1024 * 1024;
const allowedTypes: Record<string, { mime: string; acceptedMimes: string[]; resourceType: 'image' | 'raw' }> = {
  png: { mime: 'image/png', acceptedMimes: ['image/png'], resourceType: 'image' },
  jpg: { mime: 'image/jpeg', acceptedMimes: ['image/jpeg'], resourceType: 'image' },
  jpeg: { mime: 'image/jpeg', acceptedMimes: ['image/jpeg'], resourceType: 'image' },
  gif: { mime: 'image/gif', acceptedMimes: ['image/gif'], resourceType: 'image' },
  webp: { mime: 'image/webp', acceptedMimes: ['image/webp'], resourceType: 'image' },
  pdf: { mime: 'application/pdf', acceptedMimes: ['application/pdf'], resourceType: 'raw' },
  doc: { mime: 'application/msword', acceptedMimes: ['application/msword'], resourceType: 'raw' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', acceptedMimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], resourceType: 'raw' },
  txt: { mime: 'text/plain', acceptedMimes: ['text/plain', 'application/octet-stream'], resourceType: 'raw' },
  csv: { mime: 'text/csv', acceptedMimes: ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'], resourceType: 'raw' },
};

function hasValidSignature(extension: string, bytes: Uint8Array) {
  const starts = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (extension === 'png') return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (extension === 'jpg' || extension === 'jpeg') return starts(0xff, 0xd8, 0xff);
  if (extension === 'gif') return String.fromCharCode(...bytes.slice(0, 6)) === 'GIF87a' || String.fromCharCode(...bytes.slice(0, 6)) === 'GIF89a';
  if (extension === 'webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (extension === 'pdf') return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  if (extension === 'doc') return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  if (extension === 'docx') return starts(0x50, 0x4b, 0x03, 0x04);
  if (extension === 'txt' || extension === 'csv') return !bytes.includes(0);
  return false;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a file to upload' }, { status: 400 });
    if (file.size < 1 || file.size > MAX_SIZE) return NextResponse.json({ error: 'Files must be smaller than 15 MB' }, { status: 400 });

    const conversationId = formData.get('conversationId');
    const projectId = formData.get('projectId');
    if (Boolean(conversationId) === Boolean(projectId)) {
      return NextResponse.json({ error: 'Choose exactly one chat destination' }, { status: 400 });
    }
    const chatTarget = typeof projectId === 'string' && projectId
      ? { projectId }
      : typeof conversationId === 'string' && conversationId
        ? { conversationId }
        : null;
    if (!chatTarget) return NextResponse.json({ error: 'Choose a chat destination' }, { status: 400 });
    let canUpload = false;
    if (typeof conversationId === 'string' && conversationId && mongoose.isValidObjectId(conversationId)) {
      canUpload = Boolean(await Conversation.exists({ _id: conversationId, participants: user._id }));
    } else if (typeof projectId === 'string' && projectId && mongoose.isValidObjectId(projectId)) {
      canUpload = Boolean(await Project.exists({ _id: projectId, members: user._id }));
    }
    if (!canUpload) return NextResponse.json({ error: 'You do not have access to this chat' }, { status: 403 });

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const type = allowedTypes[extension];
    if (!type || (file.type && !type.acceptedMimes.includes(file.type))) {
      return NextResponse.json({ error: 'This file type is not supported' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(extension, buffer)) return NextResponse.json({ error: 'The file content does not match its extension' }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'File storage is not configured' }, { status: 503 });
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    const uploadId = randomUUID();
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
      bytes: number;
      format?: string;
    }>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream({
        folder: 'project-matchmaker-chat',
        public_id: `${user._id}/${uploadId}`,
        resource_type: type.resourceType,
        filename_override: file.name,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
      }, (error, uploaded) => {
        if (error) reject(error);
        else if (!uploaded) reject(new Error('Storage returned no upload result'));
        else resolve(uploaded);
      });
      upload.end(buffer);
    });

      const uploaded = await ChatUpload.create({
        userId: user._id,
        ...chatTarget,
        fileName: file.name.replace(/[\\/\r\n"]/g, '_'),
        mimeType: type.mime,
        size: result.bytes,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      return NextResponse.json({
        attachment: {
          uploadId: uploaded._id.toString(),
          fileName: uploaded.fileName,
          mimeType: type.mime,
          size: uploaded.size,
        },
      });
  } catch (error) {
    console.error('Chat attachment upload failed:', error);
    return NextResponse.json({ error: 'Unable to upload attachment' }, { status: 500 });
  }
}
