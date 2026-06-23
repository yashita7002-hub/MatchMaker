import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String, required: true },
  text: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
