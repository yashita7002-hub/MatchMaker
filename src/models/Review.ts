import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  projectId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  communication: number;
  technicalSkills: number;
  reliability: number;
  teamwork: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  communication: { type: Number, required: true, min: 1, max: 5 },
  technicalSkills: { type: Number, required: true, min: 1, max: 5 },
  reliability: { type: Number, required: true, min: 1, max: 5 },
  teamwork: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
