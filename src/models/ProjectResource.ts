import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectResource extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  description: string;
  type: 'Code' | 'Design' | 'Docs' | 'Infra' | 'Other';
  createdAt: Date;
}

const ProjectResourceSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  type: { type: String, enum: ['Code', 'Design', 'Docs', 'Infra', 'Other'], default: 'Other' },
}, { timestamps: { createdAt: true, updatedAt: false } });

const ProjectResource: Model<IProjectResource> =
  mongoose.models.ProjectResource || mongoose.model<IProjectResource>('ProjectResource', ProjectResourceSchema);

export default ProjectResource;
