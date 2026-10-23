import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IChatUpload extends Document {
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  publicId: string;
  resourceType: string;
  expiresAt: Date;
}

const ChatUploadSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  resourceType: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

const ChatUpload: Model<IChatUpload> = mongoose.models.ChatUpload
  || mongoose.model<IChatUpload>('ChatUpload', ChatUploadSchema);

export default ChatUpload;
