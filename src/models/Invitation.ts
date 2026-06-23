import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvitation extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined'],
    default: 'Pending',
    index: true,
  },
}, { timestamps: true });

const Invitation: Model<IInvitation> = mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);

export default Invitation;
