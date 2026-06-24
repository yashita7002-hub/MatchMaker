import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectAnalytics extends Document {
  projectId: mongoose.Types.ObjectId;
  teamActivityCount: number;
  taskCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  contributionStats: {
    userId: mongoose.Types.ObjectId;
    tasksCompleted: number;
    discussionsCreated: number;
    messagesCount: number;
    lastActivity: Date;
  }[];
  expenseTrends: {
    date: Date;
    totalAmount: number;
    category: string;
  }[];
  totalExpenses: number;
  discussionCount: number;
  messageCount: number;
  projectProgress: number; // percentage
  lastUpdated: Date;
}

const ProjectAnalyticsSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
  teamActivityCount: { type: Number, default: 0 },
  taskCompletionRate: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  inProgressTasks: { type: Number, default: 0 },
  todoTasks: { type: Number, default: 0 },
  reviewTasks: { type: Number, default: 0 },
  contributionStats: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      tasksCompleted: { type: Number, default: 0 },
      discussionsCreated: { type: Number, default: 0 },
      messagesCount: { type: Number, default: 0 },
      lastActivity: { type: Date, default: Date.now },
    },
  ],
  expenseTrends: [
    {
      date: { type: Date, required: true },
      totalAmount: { type: Number, required: true },
      category: { type: String, required: true },
    },
  ],
  totalExpenses: { type: Number, default: 0 },
  discussionCount: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
  projectProgress: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const ProjectAnalytics: Model<IProjectAnalytics> = mongoose.models.ProjectAnalytics || mongoose.model<IProjectAnalytics>('ProjectAnalytics', ProjectAnalyticsSchema);

export default ProjectAnalytics;
