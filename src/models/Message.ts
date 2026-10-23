import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMessage extends Document {
  projectId?: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  senderName: string;
  senderAvatar?: string;
  text: string;
  imageUrl?: string;
  attachments: {
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
    publicId: string;
    resourceType: string;
  }[];
  replyTo?: mongoose.Types.ObjectId;
  reactions: { userId: mongoose.Types.ObjectId; emoji: string }[];
  deliveredTo: mongoose.Types.ObjectId[];
  readBy: mongoose.Types.ObjectId[];
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
}

const AttachmentSchema = new Schema({
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  resourceType: { type: String, required: true },
}, { _id: false });

const MessageSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String, default: '' },
  text: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  attachments: { type: [AttachmentSchema], default: [] },
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true, maxlength: 16 },
  }],
  deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

MessageSchema.index({ projectId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, createdAt: 1 });

const cachedMessage = mongoose.models.Message as Model<IMessage> | undefined;
if (cachedMessage && !cachedMessage.schema.path('conversationId')) {
  mongoose.deleteModel('Message');
}

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
