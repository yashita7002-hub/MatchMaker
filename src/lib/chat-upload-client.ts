import { PendingAttachment } from '@/types';

export function uploadChatFile(
  file: File,
  chatId: string,
  type: 'direct' | 'group',
  onProgress?: (progressText: string) => void
): Promise<PendingAttachment> {
  return new Promise<PendingAttachment>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(type === 'group' ? 'projectId' : 'conversationId', chatId);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/chat/upload');
    request.withCredentials = true;

    request.upload.onprogress = event => {
      if (event.lengthComputable && onProgress) {
        onProgress(`${file.name} · ${Math.round((event.loaded / event.total) * 100)}%`);
      }
    };

    request.onerror = () => reject(new Error(`Upload failed for ${file.name}`));

    request.onload = () => {
      try {
        const data = JSON.parse(request.responseText || '{}');
        if (request.status >= 200 && request.status < 300) {
          resolve(data.attachment);
        } else {
          reject(new Error(data.error || `Upload failed for ${file.name}`));
        }
      } catch {
        reject(new Error(`Invalid response during upload for ${file.name}`));
      }
    };

    request.send(formData);
  });
}
