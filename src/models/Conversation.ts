import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IConversation extends Document {
  type: 'direct';
  participants: mongoose.Types.ObjectId[];
  directKey: string;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
  type: { type: String, enum: ['direct'], required: true, default: 'direct' },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  directKey: { type: String, required: true, unique: true },
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Conversation: Model<IConversation> = mongoose.models.Conversation
  || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
