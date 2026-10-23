interface ChatAttachmentResponse {
  fileName?: string;
  url?: string;
}

interface ChatMessageResponse {
  _id: string | { toString(): string };
  imageUrl?: string;
  attachments?: ChatAttachmentResponse[];
  replyTo?: unknown;
}

function isChatMessageResponse(value: unknown): value is ChatMessageResponse {
  if (!value || typeof value !== 'object' || !('_id' in value)) return false;
  const id = value._id;
  return typeof id === 'string'
    || (typeof id === 'object' && id !== null && 'toString' in id && typeof id.toString === 'function');
}

export function protectChatMessage<T extends ChatMessageResponse>(message: T): T {
  const messageId = message._id.toString();
  const protectedMessage: ChatMessageResponse = {
    ...message,
    imageUrl: message.imageUrl
      ? `/api/chat/attachments/download?messageId=${messageId}&legacy=1&inline=1`
      : '',
    attachments: message.attachments?.map((attachment, index) => ({
      ...attachment,
      url: `/api/chat/attachments/download?messageId=${messageId}&index=${index}&inline=1`,
    })),
  };
  const reply = message.replyTo;
  if (isChatMessageResponse(reply)) {
    protectedMessage.replyTo = protectChatMessage(reply);
  }
  return protectedMessage as T;
}
