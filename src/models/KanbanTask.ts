import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKanbanTask extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assignedUserId?: mongoose.Types.ObjectId;
  assignedUserName?: string;
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KanbanTaskSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done'],
    default: 'todo',
    index: true,
  },
  assignedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedUserName: { type: String, default: '' },
  dueDate: { type: String, default: '' },
}, { timestamps: true });

const KanbanTask: Model<IKanbanTask> = mongoose.models.KanbanTask || mongoose.model<IKanbanTask>('KanbanTask', KanbanTaskSchema);

export default KanbanTask;
