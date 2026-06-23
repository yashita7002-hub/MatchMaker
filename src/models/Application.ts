import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApplication extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  coverLetter: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, required: true },
  coverLetter: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
    index: true,
  },
}, { timestamps: true });

const Application: Model<IApplication> = mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application;
