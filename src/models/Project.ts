import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  requiredRoles: string[];
  maxTeamSize: number;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Archived';
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  requiredSkills: [{ type: String }],
  requiredRoles: [{ type: String }],
  maxTeamSize: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Recruiting', 'Active', 'Completed', 'Archived'],
    default: 'Recruiting',
    index: true,
  },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
