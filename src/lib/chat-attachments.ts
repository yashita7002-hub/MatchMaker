export interface ChatAttachment {
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  publicId: string;
  resourceType: string;
}

export function isValidLegacyChatImage(imageUrl: string) {
  if (!imageUrl) return true;
  const dataUrl = /^data:image\/(?:png|jpeg|gif|webp);base64,([a-z\d+/=]+)$/i.exec(imageUrl);
  if (dataUrl) {
    return dataUrl[1].length <= 20 * 1024 * 1024
      && Buffer.from(dataUrl[1], 'base64').byteLength <= 15 * 1024 * 1024;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  try {
    const url = new URL(imageUrl);
    return url.protocol === 'https:'
      && url.hostname === 'res.cloudinary.com'
      && url.pathname.startsWith(`/${cloudName}/image/upload/`);
  } catch {
    return false;
  }
}

const attachmentTypes: Record<string, { mimeType: string; resourceType: string }> = {
  png: { mimeType: 'image/png', resourceType: 'image' },
  jpg: { mimeType: 'image/jpeg', resourceType: 'image' },
  jpeg: { mimeType: 'image/jpeg', resourceType: 'image' },
  gif: { mimeType: 'image/gif', resourceType: 'image' },
  webp: { mimeType: 'image/webp', resourceType: 'image' },
  pdf: { mimeType: 'application/pdf', resourceType: 'raw' },
  doc: { mimeType: 'application/msword', resourceType: 'raw' },
  docx: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', resourceType: 'raw' },
  txt: { mimeType: 'text/plain', resourceType: 'raw' },
  csv: { mimeType: 'text/csv', resourceType: 'raw' },
};

export function isValidChatAttachment(value: unknown, userId: string): value is ChatAttachment {
  if (!value || typeof value !== 'object') return false;
  const attachment = value as Record<string, unknown>;
  if (
    typeof attachment.fileName !== 'string'
    || typeof attachment.mimeType !== 'string'
    || typeof attachment.size !== 'number'
    || typeof attachment.url !== 'string'
    || typeof attachment.publicId !== 'string'
    || typeof attachment.resourceType !== 'string'
  ) return false;

  const extension = attachment.fileName.split('.').pop()?.toLowerCase() || '';
  const type = attachmentTypes[extension];
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (
    !type
    || !cloudName
    || attachment.mimeType !== type.mimeType
    || attachment.resourceType !== type.resourceType
    || attachment.size < 1
    || attachment.size > 15 * 1024 * 1024
    || attachment.fileName.length > 255
    || !attachment.publicId.startsWith(`project-matchmaker-chat/${userId}/`)
  ) return false;

  try {
    const url = new URL(attachment.url);
    return url.protocol === 'https:'
      && url.hostname === 'res.cloudinary.com'
      && url.pathname.startsWith(`/${cloudName}/${type.resourceType}/upload/`)
      && url.pathname.includes(`/${attachment.publicId}`);
  } catch {
    return false;
  }
}
