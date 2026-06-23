import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReply {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
}

export interface IDiscussion extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  category: string;
  creatorId: mongoose.Types.ObjectId;
  creatorName: string;
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, required: true },
  text: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const DiscussionSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true },
  category: { type: String, required: true, default: 'General', index: true },
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  creatorName: { type: String, required: true },
  replies: [ReplySchema],
}, { timestamps: true });

const Discussion: Model<IDiscussion> = mongoose.models.Discussion || mongoose.model<IDiscussion>('Discussion', DiscussionSchema);

export default Discussion;
