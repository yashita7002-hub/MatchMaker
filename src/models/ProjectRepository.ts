import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectRepository extends Document {
  projectId: mongoose.Types.ObjectId;
  repositoryName: string;
  repositoryUrl: string;
  githubId: string;
  createdAt: Date;
  invitedMembers: {
    userId: mongoose.Types.ObjectId;
    githubUsername: string;
    invitationStatus: 'pending' | 'accepted' | 'declined';
  }[];
}

const ProjectRepositorySchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
  repositoryName: { type: String, required: true },
  repositoryUrl: { type: String, required: true },
  githubId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  invitedMembers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      githubUsername: { type: String, required: true },
      invitationStatus: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
      },
    },
  ],
}, { timestamps: true });

const ProjectRepository: Model<IProjectRepository> = mongoose.models.ProjectRepository || mongoose.model<IProjectRepository>('ProjectRepository', ProjectRepositorySchema);

export default ProjectRepository;
